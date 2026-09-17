from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class SearchSession(Base):
    __tablename__ = "search_sessions"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(String(64), unique=True, index=True, nullable=False)
    query = Column(Text, nullable=False)
    status = Column(String(64), default="started", nullable=False)
    selected_idea_id = Column(String(64), nullable=True)
    selected_idea_title = Column(Text, nullable=True)
    final_report = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    ideas = relationship(
        "SearchIdea",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="SearchIdea.id",
    )


class SearchIdea(Base):
    __tablename__ = "search_ideas"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("search_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    thread_id = Column(String(64), index=True, nullable=False)
    idea_id = Column(String(64), nullable=True)
    title = Column(Text, nullable=False)
    core_problem = Column(Text, nullable=True)
    domain = Column(String(255), nullable=True)
    feasibility_score = Column(Integer, nullable=True)
    is_selected = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    session = relationship("SearchSession", back_populates="ideas")
