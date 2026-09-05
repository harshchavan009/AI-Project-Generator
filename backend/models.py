"""
SQLAlchemy 2.0 ORM Models for CapstoneForge.
Supports both PostgreSQL (production) and SQLite (testing/local fallback).
"""

import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime,
    ForeignKey, PrimaryKeyConstraint, Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class UserModel(Base):
    """Platform user account for Authentication & Role-Based Access Control."""
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), default="student", nullable=False) # student, faculty, admin
    name = Column(String(255), nullable=False)
    department = Column(String(255), default="Computer Science & Engineering")
    cohort_id = Column(String(64), default="cohort-cse-2026-a")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class StudentModel(Base):
    """Student profile data."""
    __tablename__ = "students"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(Text, nullable=True) # encrypted PII
    branch = Column(String(255), default="Computer Science")
    team_size = Column(Integer, default=1)
    timeframe_weeks = Column(Integer, default=16)
    hardware_constraint = Column(String(64), default="CPU-only")
    interest_domains = Column(Text, default="[]") # JSON encoded list
    skills_json = Column(Text, default="{}") # JSON encoded dict
    selected_idea_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ProjectModel(Base):
    """Student finalized projects / blueprints."""
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(64), nullable=False, index=True)
    student_name = Column(String(255), nullable=True)
    idea_id = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=False)
    problem_statement = Column(Text, nullable=True)
    mvp_features = Column(Text, default="[]") # JSON list
    stretch_features = Column(Text, default="[]") # JSON list
    tech_stack = Column(Text, default="[]") # JSON list
    citations_json = Column(Text, default="[]") # JSON list
    novelty_score = Column(Float, default=80.0)
    feasibility_score = Column(Float, default=75.0)
    hireability_score = Column(Float, default=80.0)
    drift_status = Column(String(64), default="On Track")
    repo_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CohortModel(Base):
    """Cohort grouping for multi-tenant faculty oversight."""
    __tablename__ = "cohorts"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    faculty_id = Column(String(64), nullable=True)
    faculty_name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    academic_year = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CohortStudentModel(Base):
    """Many-to-many link between cohorts and students."""
    __tablename__ = "cohort_students"

    cohort_id = Column(String(64), primary_key=True)
    student_id = Column(String(64), primary_key=True)

    __table_args__ = (
        PrimaryKeyConstraint("cohort_id", "student_id"),
    )

class GenerationCacheModel(Base):
    """Deterministic proposal generation cache."""
    __tablename__ = "generation_cache"

    cache_key = Column(String(128), primary_key=True, index=True)
    data_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MentorMessageModel(Base):
    """Logged mentor interaction messages."""
    __tablename__ = "mentor_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(64), nullable=False, index=True)
    sender = Column(String(32), nullable=False) # user, assistant, system
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class DepartmentArchiveModel(Base):
    """Past capstone projects for department vector uniqueness index."""
    __tablename__ = "department_archives"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    abstract = Column(Text, nullable=False)
    domain = Column(String(255), default="General Engineering")
    year = Column(Integer, default=2025)
    uploaded_by = Column(String(255), default="Faculty Admin")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class TaskModel(Base):
    """Kanban Task Board deliverable linked to project roadmap."""
    __tablename__ = "tasks"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(32), default="Not Started", nullable=False) # Not Started, In Progress, Completed
    linked_week = Column(Integer, default=1)
    is_stretch = Column(Integer, default=0) # 0 for MVP, 1 for Stretch
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

