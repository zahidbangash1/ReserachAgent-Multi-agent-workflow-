from typing import TypedDict, List, Optional, Literal
from typing_extensions import Annotated
import operator


from .models import (
    ErrorLog,
    TavilySearchResult,
    ResearchPaper,
    CitationIssue,
    FYPIdea,
    ResearchGap,
    MethodologyStep,
    ExperimentDesign,
    ExperimentResult,
    ResultsEvaluation,
    FeasibilityReview,
    FYPPlan,
)


# ============================================================
# RETRY LIMITS
# Enforce these inside the conditional edges (e.g. add_conditional_edges)
# for every human-rejection loop, not just experiments, to avoid infinite loops.
# ============================================================
MAX_IDEA_GENERATION_ATTEMPTS = 3
MAX_GAP_FINDING_ATTEMPTS = 3
MAX_METHODOLOGY_ATTEMPTS = 3
MAX_EXPERIMENT_ATTEMPTS = 3
MAX_FINAL_REVIEW_ATTEMPTS = 3


# ============================================================

# ============================================================
AgentName = Literal[
    "router",
    "clarification",
    "idea_generator",
    "auto_select_topic",
    "human_topic_approval",
    "literature_review",
    "citation_validator",
    "gap_finder",
    "human_gap_approval",
    "proposal_writer",
    "methodology_designer",
    "feasibility_reviewer",
    "experiment_planner",
    "experiment_executor",
    "results_evaluator",
    "report_writer",
    "human_final_review",
]


# ============================================================

# ============================================================
Status = Literal[
    "idle",
    "routing",
    "awaiting_input",
    "awaiting_clarification",
    "generating_ideas",
    "idea_generation_failed",
    "awaiting_topic_approval",
    "researching",
    "literature_review_failed",
    "validating_citations",
    "citation_validation_failed",
    "finding_gaps",
    "gap_finding_failed",
    "awaiting_gap_approval",
    "writing_proposal",
    "proposal_writing_failed",
    "designing_methodology",
    "methodology_design_failed",
    "reviewing_feasibility",
    "feasibility_review_failed",
    "planning_experiments",
    "experiment_planning_failed",
    "executing_experiments",
    "experiment_execution_failed",
    "evaluating_results",
    "results_evaluation_failed",
    "writing_report",
    "report_writing_failed",
    "awaiting_final_review",
    "completed",
]

ApprovalStatus = Literal["pending", "approved", "rejected"]

ResultsApprovalStatus = Literal["pending", "approved", "rejected", "best_effort"]


# ============================================================
class FYPState(TypedDict):

    # --- SESSION CONTROL ---
    thread_id: str
    user_query: str
    status: Status
    current_agent: AgentName
    previous_agent: Optional[AgentName]

    trace: Annotated[List[str], operator.add]

    # --- ROUTING ---
    router_decision: Optional[
        Literal["topic_missing", "topic_available", "clarification_needed"]
    ]
    topic: Optional[str]
    router_confidence: Optional[float]
    router_reasoning: Optional[str]
    router_used_fallback: Optional[bool]
    router_error_type: Optional[str]

    # --- CLARIFICATION ---
    # FIX: "clarification" was already an AgentName and router_decision option,
    # but no fields existed to actually hold the question/answer.
    clarification_question: Optional[str]
    user_clarification_response: Optional[str]

    # --- MEMORY / CONTEXT ---
    plan: Optional[FYPPlan]

    # --- SEARCH LAYER ---
    tavily_search_queries: List[str]
    raw_search_results: List[TavilySearchResult]
    ranked_search_results: List[TavilySearchResult]

    # FIX: operator.add removed. idea_generator re-runs on rejection, so this
    # must be overwritten with the latest batch each attempt, not appended to
    # (otherwise ideas from rejected attempts leak into later state reads).
    ideas: List[FYPIdea]
    selected_idea: Optional[FYPIdea]
    topic_approval: ApprovalStatus

    topic_approval_feedback: Optional[str]
    idea_generation_attempts: int

    idea_generation_failures: int

    # --- RESEARCH LAYER ---
    papers: Annotated[List[ResearchPaper], operator.add]
    citation_issues: List[CitationIssue]

    # FIX: operator.add removed (same reason as ideas — gap_finder re-runs on
    # rejection). Type changed from List[str] to List[ResearchGap] so downstream
    # agents (proposal_writer) get structured gaps instead of raw strings.
    research_gaps: List[ResearchGap]
    gap_approval: ApprovalStatus
    gap_finding_attempts: int

    gap_rejection_feedback: Optional[str]

    proposal_draft: Optional[str]

    # FIX: operator.add removed (methodology_designer re-runs if
    # feasibility_reviewer rejects). Type changed from List[str] to
    # List[MethodologyStep] for structured downstream use.
    methodology_steps: List[MethodologyStep]
    feasibility_review: Optional[FeasibilityReview]

    feasibility_approval: ApprovalStatus
    methodology_attempts: int

    methodology_rejection_feedback: Optional[str]

    # --- EXPERIMENT LAYER ---
    experiment_plan: Optional[ExperimentDesign]

    # operator.add kept here on purpose: ExperimentResult.attempt already
    # tracks which run each entry belongs to, so accumulating history across
    # retries is the intended behavior (unlike ideas/gaps/methodology above).
    experiment_results: Annotated[List[ExperimentResult], operator.add]
    results_evaluation: Optional[ResultsEvaluation]

    results_approval: ResultsApprovalStatus

    results_limited_by_attempt_cap: bool
    experiment_attempts: int

    # --- OUTPUT + HUMAN GATE 3 ---
    final_report: Optional[str]
    final_review: ApprovalStatus
    # human feedback on the final report, so report_writer_agent.py
    # can revise instead of only ever producing one draft.
    final_review_feedback: Optional[str]
    final_review_attempts: int

    # --- QUALITY CONTROL ---
    confidence_score: float

    # --- ERROR LOGGING ---
    errors: Annotated[List[ErrorLog], operator.add]
    # almost every agent returns a human-readable failure reason
    # under this key.
    error_reasoning: Optional[str]


def create_initial_state(thread_id: str, user_query: str) -> FYPState:
    return FYPState(
        thread_id=thread_id,
        user_query=user_query,
        status="idle",
        current_agent="router",
        previous_agent=None,
        trace=[],
        router_decision=None,
        topic=None,
        router_confidence=None,
        router_reasoning=None,
        router_used_fallback=None,
        router_error_type=None,
        clarification_question=None,
        user_clarification_response=None,
        plan=None,
        tavily_search_queries=[],
        raw_search_results=[],
        ranked_search_results=[],
        ideas=[],
        selected_idea=None,
        topic_approval="pending",
        topic_approval_feedback=None,
        idea_generation_attempts=0,
        idea_generation_failures=0,
        papers=[],
        citation_issues=[],
        research_gaps=[],
        gap_approval="pending",
        gap_finding_attempts=0,
        gap_rejection_feedback=None,
        proposal_draft=None,
        methodology_steps=[],
        feasibility_review=None,
        feasibility_approval="pending",
        methodology_attempts=0,
        methodology_rejection_feedback=None,
        experiment_plan=None,
        experiment_results=[],
        results_evaluation=None,
        results_approval="pending",
        results_limited_by_attempt_cap=False,
        experiment_attempts=0,
        final_report=None,
        final_review="pending",
        final_review_feedback=None,
        final_review_attempts=0,
        confidence_score=0.0,
        errors=[],
        error_reasoning=None,
    )