import os
import logging
from contextlib import contextmanager
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

logger = logging.getLogger(__name__)

raw_db_url = os.getenv("DATABASE_URL", "").strip()

# Normalize URL for psycopg v3 if needed
if raw_db_url.startswith("postgresql://"):
    DB_URL = raw_db_url.replace("postgresql://", "postgresql+psycopg://", 1)
else:
    DB_URL = raw_db_url

if not DB_URL:
    logger.warning("DATABASE_URL not found in environment. Database features may fail.")

engine = create_engine(
    DB_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    """Create all database tables if they do not exist."""
    try:
        from . import models  # Ensure all models are registered
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as exc:
        logger.error(f"Error during init_db: {exc}", exc_info=True)


@contextmanager
def get_db_context():
    """Context manager for database sessions."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
