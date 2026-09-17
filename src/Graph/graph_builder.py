"""
Graph Builder
--------------
Wires every agent from src/agents/ into a single StateGraph, matching the
diagram's edges (including the 4 rejection loops). Compiled with a
checkpointer since human_topic_approval, human_gap_approval,
clarification_agent, and human_final_review all use interrupt() —
interrupt() only works on a checkpointed graph.

Routing note: when a rejection loop's MAX_*_ATTEMPTS cap is hit, the
approval node itself sets status to a "*_failed" value (see e.g.
human_topic_approval.py) instead of looping again — the conditional edges
below read that status to break out of the loop and proceed best-effort,
rather than encoding the cap check twice.
"""

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from ..schemas.state import FYPState

from ..agents.router_agent import router_agent
from ..agents.clarification_agent import clarification_agent
from ..agents.idea_generator import idea_generator
from ..agents.auto_select_topic import auto_select_topic
from ..agents.human_topic_approval import human_topic_approval
from ..agents.literature_review_agent import literature_review_agent
from ..agents.citation_validator import citation_validator
from ..agents.gap_finder import gap_finder
from ..agents.human_gap_approval import human_gap_approval
from ..agents.proposal_writer import proposal_writer
from ..agents.methodology_designer import methodology_designer
from ..agents.feasibility_reviewer import feasibility_reviewer
from ..agents.experiment_planner import experiment_planner
from ..agents.experiment_executor import experiment_executor
from ..agents.results_evaluator import results_evaluator
from ..agents.report_writer import report_writer
from ..agents.human_final_review import human_final_review


# ---- conditional edge routers ----

def route_after_router(state: FYPState) -> str:
    decision = state.get("router_decision")
    if decision == "topic_missing":
        return "idea_generator"
    if decision == "topic_available":
        return "auto_select_topic"
    return "clarification"


def route_after_topic_approval(state: FYPState) -> str:
    if state.get("topic_approval") == "approved":
        return "literature_review"
    if state.get("status") == "idea_generation_failed":
        # attempt cap hit — proceed best-effort with whatever idea exists.
        # TODO: idea_generator currently doesn't guarantee selected_idea is set
        # in this path; literature_review_agent falls back to state["topic"]/
        # user_query if selected_idea is None, but wiring an explicit
        # "pick best of last batch" step here would be cleaner.
        return "literature_review"
    return "idea_generator"


def route_after_gap_approval(state: FYPState) -> str:
    if state.get("gap_approval") == "approved":
        return "proposal_writer"
    if state.get("status") == "gap_finding_failed":
        return "proposal_writer"  # cap hit, proceed best-effort
    return "gap_finder"


def route_after_feasibility(state: FYPState) -> str:
    if state.get("feasibility_approval") == "approved":
        return "experiment_planner"
    if state.get("status") == "methodology_design_failed":
        return "experiment_planner"  # cap hit, proceed best-effort
    return "methodology_designer"


def route_after_results(state: FYPState) -> str:
    if state.get("results_approval") in ("approved", "best_effort"):
        return "report_writer"
    return "experiment_planner"


def route_after_final_review(state: FYPState) -> str:
    if state.get("status") == "completed":
        return END
    return "report_writer"


def build_graph():
    workflow = StateGraph(FYPState)

    workflow.add_node("router", router_agent)
    workflow.add_node("clarification", clarification_agent)
    workflow.add_node("idea_generator", idea_generator)
    workflow.add_node("auto_select_topic", auto_select_topic)
    workflow.add_node("human_topic_approval", human_topic_approval)
    workflow.add_node("literature_review", literature_review_agent)
    workflow.add_node("citation_validator", citation_validator)
    workflow.add_node("gap_finder", gap_finder)
    workflow.add_node("human_gap_approval", human_gap_approval)
    workflow.add_node("proposal_writer", proposal_writer)
    workflow.add_node("methodology_designer", methodology_designer)
    workflow.add_node("feasibility_reviewer", feasibility_reviewer)
    workflow.add_node("experiment_planner", experiment_planner)
    workflow.add_node("experiment_executor", experiment_executor)
    workflow.add_node("results_evaluator", results_evaluator)
    workflow.add_node("report_writer", report_writer)
    workflow.add_node("human_final_review", human_final_review)

    workflow.add_edge(START, "router")
    workflow.add_conditional_edges(
        "router",
        route_after_router,
        {"idea_generator": "idea_generator", "auto_select_topic": "auto_select_topic", "clarification": "clarification"},
    )
    workflow.add_edge("clarification", "router")

    workflow.add_edge("idea_generator", "human_topic_approval")
    workflow.add_conditional_edges(
        "human_topic_approval",
        route_after_topic_approval,
        {"literature_review": "literature_review", "idea_generator": "idea_generator"},
    )
    workflow.add_edge("auto_select_topic", "literature_review")

    workflow.add_edge("literature_review", "citation_validator")
    workflow.add_edge("citation_validator", "gap_finder")
    workflow.add_edge("gap_finder", "human_gap_approval")
    workflow.add_conditional_edges(
        "human_gap_approval",
        route_after_gap_approval,
        {"proposal_writer": "proposal_writer", "gap_finder": "gap_finder"},
    )

    workflow.add_edge("proposal_writer", "methodology_designer")
    workflow.add_edge("methodology_designer", "feasibility_reviewer")
    workflow.add_conditional_edges(
        "feasibility_reviewer",
        route_after_feasibility,
        {"experiment_planner": "experiment_planner", "methodology_designer": "methodology_designer"},
    )

    workflow.add_edge("experiment_planner", "experiment_executor")
    workflow.add_edge("experiment_executor", "results_evaluator")
    workflow.add_conditional_edges(
        "results_evaluator",
        route_after_results,
        {"report_writer": "report_writer", "experiment_planner": "experiment_planner"},
    )

    workflow.add_edge("report_writer", "human_final_review")
    workflow.add_conditional_edges(
        "human_final_review",
        route_after_final_review,
        {END: END, "report_writer": "report_writer"},
    )

    checkpointer = MemorySaver()
    return workflow.compile(checkpointer=checkpointer)