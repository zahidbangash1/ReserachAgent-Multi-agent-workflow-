import logging
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import joinedload

from .database import get_db_context
from .models import SearchSession, SearchIdea

logger = logging.getLogger(__name__)


def record_new_search(thread_id: str, query: str) -> Optional[SearchSession]:
    """Records an initial search request in the database."""
    try:
        with get_db_context() as db:
            existing = db.query(SearchSession).filter(SearchSession.thread_id == thread_id).first()
            if existing:
                existing.query = query
                existing.status = "started"
                return existing

            session_record = SearchSession(
                thread_id=thread_id,
                query=query,
                status="started",
            )
            db.add(session_record)
            db.flush()
            logger.info(f"Recorded new search session for thread_id={thread_id}")
            return session_record
    except Exception as exc:
        logger.error(f"Failed to record new search in DB: {exc}", exc_info=True)
        return None


def sync_state_to_db(thread_id: str, state: Dict[str, Any]) -> None:
    """Synchronizes state snapshot updates (status, ideas, selection, report) to PostgreSQL."""
    try:
        with get_db_context() as db:
            session_record = db.query(SearchSession).filter(SearchSession.thread_id == thread_id).first()
            if not session_record:
                # If record wasn't created yet, create it now
                user_query = state.get("user_query") or "Unknown Query"
                session_record = SearchSession(thread_id=thread_id, query=user_query, status="started")
                db.add(session_record)
                db.flush()

            # Update status
            status = state.get("status")
            if status:
                session_record.status = status

            # Update final report if available
            final_report = state.get("final_report")
            if final_report:
                session_record.final_report = final_report

            # Sync selected idea if available
            selected_idea = state.get("selected_idea")
            selected_idea_id = None
            if selected_idea:
                if hasattr(selected_idea, "id"):
                    selected_idea_id = selected_idea.id
                    session_record.selected_idea_id = selected_idea.id
                    session_record.selected_idea_title = getattr(selected_idea, "title", None)
                elif isinstance(selected_idea, dict):
                    selected_idea_id = selected_idea.get("id")
                    session_record.selected_idea_id = selected_idea_id
                    session_record.selected_idea_title = selected_idea.get("title")

            # Sync generated ideas
            ideas = state.get("ideas", [])
            if ideas:
                # Get existing ideas for this session
                existing_ideas = db.query(SearchIdea).filter(SearchIdea.session_id == session_record.id).all()
                existing_by_id = {i.idea_id: i for i in existing_ideas if i.idea_id}

                for idea in ideas:
                    if hasattr(idea, "model_dump"):
                        idea_data = idea.model_dump()
                    elif hasattr(idea, "dict"):
                        idea_data = idea.dict()
                    elif isinstance(idea, dict):
                        idea_data = idea
                    else:
                        continue

                    i_id = str(idea_data.get("id", ""))
                    i_title = idea_data.get("title", "Untitled Idea")
                    i_prob = idea_data.get("core_problem")
                    i_domain = idea_data.get("domain")
                    i_score = idea_data.get("feasibility_score")
                    is_sel = (i_id == selected_idea_id) if selected_idea_id else False

                    if i_id and i_id in existing_by_id:
                        # Update existing
                        rec = existing_by_id[i_id]
                        rec.title = i_title
                        rec.core_problem = i_prob
                        rec.domain = i_domain
                        rec.feasibility_score = i_score
                        if is_sel:
                            rec.is_selected = True
                    else:
                        # Insert new
                        new_idea_rec = SearchIdea(
                            session_id=session_record.id,
                            thread_id=thread_id,
                            idea_id=i_id,
                            title=i_title,
                            core_problem=i_prob,
                            domain=i_domain,
                            feasibility_score=i_score,
                            is_selected=is_sel,
                        )
                        db.add(new_idea_rec)

    except Exception as exc:
        logger.error(f"Failed to sync state to DB for thread_id={thread_id}: {exc}", exc_info=True)


def list_search_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Returns a list of recent searches stored in the database."""
    try:
        with get_db_context() as db:
            records = (
                db.query(SearchSession)
                .options(joinedload(SearchSession.ideas))
                .order_by(SearchSession.created_at.desc())
                .limit(limit)
                .all()
            )

            result = []
            for r in records:
                result.append({
                    "id": r.id,
                    "thread_id": r.thread_id,
                    "query": r.query,
                    "status": r.status,
                    "selected_idea_id": r.selected_idea_id,
                    "selected_idea_title": r.selected_idea_title,
                    "ideas_count": len(r.ideas),
                    "has_report": bool(r.final_report),
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                    "ideas": [
                        {
                            "idea_id": i.idea_id,
                            "title": i.title,
                            "core_problem": i.core_problem,
                            "domain": i.domain,
                            "feasibility_score": i.feasibility_score,
                            "is_selected": i.is_selected,
                        }
                        for i in r.ideas
                    ],
                })
            return result
    except Exception as exc:
        logger.error(f"Failed to list search history: {exc}", exc_info=True)
        return []


def get_search_details(thread_id: str) -> Optional[Dict[str, Any]]:
    """Returns complete details of a single search by thread_id."""
    try:
        with get_db_context() as db:
            r = (
                db.query(SearchSession)
                .options(joinedload(SearchSession.ideas))
                .filter(SearchSession.thread_id == thread_id)
                .first()
            )
            if not r:
                return None

            return {
                "id": r.id,
                "thread_id": r.thread_id,
                "query": r.query,
                "status": r.status,
                "selected_idea_id": r.selected_idea_id,
                "selected_idea_title": r.selected_idea_title,
                "final_report": r.final_report,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                "ideas": [
                    {
                        "idea_id": i.idea_id,
                        "title": i.title,
                        "core_problem": i.core_problem,
                        "domain": i.domain,
                        "feasibility_score": i.feasibility_score,
                        "is_selected": i.is_selected,
                    }
                    for i in r.ideas
                ],
            }
    except Exception as exc:
        logger.error(f"Failed to get search details for thread_id={thread_id}: {exc}", exc_info=True)
        return None
