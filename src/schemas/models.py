from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class ErrorLog(BaseModel):
    agent: str = Field(..., description="Agent that caused the error.")
    step: str = Field(..., description="Pipeline step where error occurred.")
    message: str = Field(..., description="Error message details.")


class TavilySearchResult(BaseModel):
    title: str
    url: str
    content: str = Field(..., description="Snippet/summary returned by Tavily.")
    score: Optional[float] = Field(None, description="Relevance score from Tavily, if available.")
    tavily_source_id: Optional[str] = None


class ResearchPaper(BaseModel):
    title: str = Field(..., description="Paper title.")
    authors: List[str] = Field(..., description="List of authors of the paper.")
    year: Optional[int] = Field(None, description="Publication year, if known.")
    url: Optional[str] = Field(None, description="Paper URL if available.")
    tavily_source_id: Optional[str] = Field(None, description="Source ID from Tavily search.")
    key_finding: str = Field(..., description="One-line summary of main contribution.")


class CitationIssue(BaseModel):
    paper_title: str = Field(..., description="Title of the paper with a citation problem.")
    issue: str = Field(..., description="What's wrong — broken URL, unverifiable claim, duplicate, etc.")


class FYPIdea(BaseModel):
    id: str = Field(..., description="Unique identifier for the idea.")
    title: str = Field(..., description="FYP idea title.")
    core_problem: str = Field(..., description="Problem this idea solves.")
    domain: str = Field(..., description="NLP sub-domain of this idea (free text, not restricted).")
    feasibility_score: int = Field(..., ge=1, le=10, description="Score (1-10) for feasibility.")


class ResearchGap(BaseModel):
    """Structured output of the Gap Finder Agent — replaces the old raw string list
    so the Proposal Writer / Human: Gap Approval can reason over discrete gaps
    instead of unstructured text."""
    description: str = Field(..., description="The identified gap in existing literature.")
    supporting_papers: List[str] = Field(
        default_factory=list, description="Paper titles that highlight this gap."
    )
    novelty_justification: str = Field(..., description="Why this gap is worth addressing.")


class MethodologyStep(BaseModel):
    """Structured output of the Methodology Designer — replaces the old raw string list
    so Feasibility Reviewer / Proposal Writer / Report Writer get consistent structure
    instead of free-form sentences."""
    step_number: int = Field(..., description="Order of this step in the methodology.")
    title: str = Field(..., description="Short name of the step, e.g. 'Data Preprocessing'.")
    description: str = Field(..., description="What happens in this step.")
    justification: Optional[str] = Field(
        None, description="Why this step is necessary / how it addresses the research gap."
    )


class ExperimentDesign(BaseModel):
    datasets: List[str] = Field(..., min_length=1, max_length=3, description="Datasets used for evaluation.")
    metrics: List[str] = Field(..., min_length=2, description="Evaluation metrics.( Accuracy, F1-score)")
    baselines: List[str] = Field(..., min_length=1, description="Baseline models for comparison.(bert)")


class ExperimentResult(BaseModel):
    attempt: int = Field(..., description="Which execution attempt this is (1, 2, 3...).")
    summary: str = Field(..., description="What was run and what was observed.")
    status: Literal["success", "failure", "error"]


class ResultsEvaluation(BaseModel):
    passed: bool
    feedback: str = Field(..., description="Why it passed/failed, and what to fix if it failed.")


class FeasibilityReview(BaseModel):
    approved: bool
    concerns: List[str] = Field(default_factory=list, description="Concerns raised if not approved.")


class FYPPlan(BaseModel):
    project_domain: str = Field(..., description="NLP domain of the project (free text).")
    audience: str = Field(default="University FYP Evaluation Panel", description="Target audience of the report.")
    tone: str = Field(default="Formal, Academic, Technical", description="Writing tone of the output.")