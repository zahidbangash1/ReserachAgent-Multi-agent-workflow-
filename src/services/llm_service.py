"""
Shared LLM service (Groq via LangChain).

Every agent should get its LLM client from here instead of instantiating
ChatGroq directly — keeps model name / temperature / retries centralized,
and makes it trivial to swap provider later if needed.
"""

import json
import logging
import os
from functools import lru_cache
from typing import Optional, Type, TypeVar

from langchain_groq import ChatGroq
from pydantic import BaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Groq model choice matters per task:
# - reasoning/generation heavy nodes (idea_generator, proposal_writer,
#   methodology_designer, report_writer) -> bigger model
# - cheap/structured/classification nodes (router, citation_validator,
#   feasibility_reviewer) -> smaller & faster model is enough
#
# IMPORTANT: both models below MUST support Groq tool-calling, since every
# get_structured_llm() call relies on with_structured_output() which uses
# tool-calling under the hood. Do NOT point these at:
#   - guardrail/classifier models (e.g. "meta-llama/llama-prompt-guard-2-22m"
#     — this is a prompt-injection *classifier*, not a chat model)
#   - reasoning/preview models (e.g. deepseek-r1-distill-*) — Groq doesn't
#     support tool-calling on these either
#
# UPDATED 2026-08-25: llama-3.1-8b-instant and llama-3.3-70b-versatile were
# both deprecated by Groq on 2026-06-17 with a shutdown date of 2026-08-16
# (already past — these model IDs now return errors). Switched to Groq's
# official recommended replacements:
#   llama-3.1-8b-instant    -> openai/gpt-oss-20b
#   llama-3.3-70b-versatile -> openai/gpt-oss-120b
# UPDATED: openai/gpt-oss-20b is the primary active model with high quota on Groq.
# If openai/gpt-oss-120b is requested but encounters RateLimitError (429 TPD limit),
# the fallback to gpt-oss-20b ensures the pipeline never hangs or gets stuck.
DEFAULT_MODEL = os.environ.get("GROQ_DEFAULT_MODEL", "openai/gpt-oss-20b")
FAST_MODEL = "openai/gpt-oss-20b"
FALLBACK_MODEL = "openai/gpt-oss-20b"


@lru_cache(maxsize=8)
def get_llm(model: str = DEFAULT_MODEL, temperature: float = 0.3, max_tokens: int = 3096) -> ChatGroq:
    """Returns a cached ChatGroq client. Cached per (model, temperature, max_tokens)
    tuple so repeated calls across agents don't re-init the client.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY not set. Add it to your .env and load it "
            "(e.g. via python-dotenv) before the graph runs."
        )
    return ChatGroq(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=api_key,
        max_retries=2,
    )


class ResilientStructuredLLM:
    """Wrapper that invokes a structured LLM and automatically:
    1. Salvages valid JSON outputs from Groq 'tool_use_failed' errors (where
       the model successfully generated valid structured data, but Groq's tool
       validator failed to match the function call signature).
    2. Falls back to method='json_schema' or method='json_mode' if tool-calling fails.
    3. Falls back to FALLBACK_MODEL if the primary model hits Groq RateLimitError (429/TPD).
    """

    def __init__(self, schema: Type[T], model: str = DEFAULT_MODEL, temperature: float = 0.3, max_tokens: int = 4096):
        self.schema = schema
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._primary = get_llm(model=model, temperature=temperature, max_tokens=max_tokens).with_structured_output(schema)

    def _salvage_failed_generation(self, exc: Exception) -> Optional[T]:
        """Extracts and validates the JSON model generation from a Groq tool_use_failed error."""
        failed_gen = None

        # 1. Try extracting from Groq error body / response dictionary
        if hasattr(exc, "body") and isinstance(exc.body, dict):
            failed_gen = exc.body.get("error", {}).get("failed_generation")
        elif hasattr(exc, "response"):
            try:
                body = exc.response.json()
                failed_gen = body.get("error", {}).get("failed_generation")
            except Exception:
                pass

        # 2. Extract from string representation if body wasn't directly accessible
        if not failed_gen:
            err_str = str(exc)
            for marker in ["'failed_generation': '", '"failed_generation": "', "'failed_generation': \"", '"failed_generation": \'']:
                idx = err_str.find(marker)
                if idx != -1:
                    start = idx + len(marker)
                    brace_idx = err_str.find("{", start)
                    if brace_idx != -1:
                        depth = 0
                        for i in range(brace_idx, len(err_str)):
                            if err_str[i] == "{":
                                depth += 1
                            elif err_str[i] == "}":
                                depth -= 1
                                if depth == 0:
                                    failed_gen = err_str[brace_idx : i + 1]
                                    break
                    if failed_gen:
                        break

        if failed_gen:
            try:
                if isinstance(failed_gen, dict):
                    data = failed_gen
                else:
                    try:
                        data = json.loads(failed_gen)
                    except Exception:
                        cleaned = failed_gen.encode("utf-8").decode("unicode_escape")
                        data = json.loads(cleaned)

                if isinstance(data, dict):
                    # Handle {"name": "...", "arguments": {...}} or direct dict
                    payload = data.get("arguments", data)
                    if isinstance(payload, str):
                        try:
                            payload = json.loads(payload)
                        except Exception:
                            pass

                    if hasattr(self.schema, "model_validate"):
                        return self.schema.model_validate(payload)
                    elif hasattr(self.schema, "parse_obj"):
                        return self.schema.parse_obj(payload)
            except Exception as parse_err:
                logger.warning(f"Could not parse salvaged failed_generation: {parse_err}")

        return None

    def invoke(self, input_data, *args, **kwargs):
        try:
            return self._primary.invoke(input_data, *args, **kwargs)
        except Exception as exc:
            err_str = str(exc).lower()

            # Case 1: Groq tool calling validation failed (e.g. tool_use_failed / was not in request.tools)
            if "tool_use_failed" in err_str or "request.tools" in err_str or "failed_generation" in err_str:
                salvaged = self._salvage_failed_generation(exc)
                if salvaged is not None:
                    logger.info("Successfully salvaged structured output from Groq failed_generation")
                    return salvaged

                # If salvage failed, retry using json_schema mode which bypasses tool calling
                try:
                    json_schema_llm = get_llm(
                        model=self.model, temperature=self.temperature, max_tokens=self.max_tokens
                    ).with_structured_output(self.schema, method="json_schema")
                    return json_schema_llm.invoke(input_data, *args, **kwargs)
                except Exception:
                    pass

                # If json_schema failed, retry using json_mode
                try:
                    json_mode_llm = get_llm(
                        model=self.model, temperature=self.temperature, max_tokens=self.max_tokens
                    ).with_structured_output(self.schema, method="json_mode")
                    return json_mode_llm.invoke(input_data, *args, **kwargs)
                except Exception:
                    pass

            # Case 2: Groq RateLimitError (429 / TPD / TPM)
            if ("rate_limit" in err_str or "429" in err_str or "tpd" in err_str) and self.model != FALLBACK_MODEL:
                fallback_llm = get_llm(
                    model=FALLBACK_MODEL, temperature=self.temperature, max_tokens=self.max_tokens
                ).with_structured_output(self.schema, method="json_schema")
                return fallback_llm.invoke(input_data, *args, **kwargs)

            # Case 3: Any other structured output failure, try json_schema before failing
            try:
                fallback_llm = get_llm(
                    model=FALLBACK_MODEL if self.model != FALLBACK_MODEL else self.model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                ).with_structured_output(self.schema, method="json_schema")
                return fallback_llm.invoke(input_data, *args, **kwargs)
            except Exception:
                pass

            raise exc


def get_structured_llm(schema: Type[T], model: str = DEFAULT_MODEL, temperature: float = 0.3, max_tokens: int = 4096):
    """Returns an LLM bound to a Pydantic schema via with_structured_output with
    automatic 429 rate limit fallback protection.
    """
    return ResilientStructuredLLM(schema=schema, model=model, temperature=temperature, max_tokens=max_tokens)