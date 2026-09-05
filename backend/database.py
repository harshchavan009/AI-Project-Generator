"""
Production Database Module for CapstoneForge.
Supports PostgreSQL (with asyncpg & connection pooling) and SQLite fallback (for test/local execution).
Uses SQLAlchemy 2.0 async sessions and declarative ORM models.
"""

import os
import json
import uuid
import datetime
from typing import List, Optional, Dict, Any

from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool

from backend import config
from backend.models import (
    Base, UserModel, StudentModel, ProjectModel,
    CohortModel, CohortStudentModel, GenerationCacheModel,
    MentorMessageModel, DepartmentArchiveModel, TaskModel
)
from backend.services.security import hash_password, encrypt_pii, decrypt_pii


# -------------------------------------------------------------
# Database Connection Configuration & Pooling
# -------------------------------------------------------------
DATABASE_URL = getattr(
    config, "DATABASE_URL",
    os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{os.path.join(os.path.dirname(__file__), 'capstoneforge.db')}")
)

# Standardize URL for asyncpg if standard postgresql:// is provided
if DATABASE_URL.startswith("postgresql://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    ASYNC_DATABASE_URL = DATABASE_URL

# Configure engine with connection pooling
if "sqlite" in ASYNC_DATABASE_URL:
    engine = create_async_engine(
        ASYNC_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_async_engine(
        ASYNC_DATABASE_URL,
        echo=False,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600
    )

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db_session() -> AsyncSession:
    """Async session dependency / generator."""
    async with async_session_factory() as session:
        yield session

# -------------------------------------------------------------
# Database Initialization & Seeding
# -------------------------------------------------------------
async def init_db():
    """Initializes tables using SQLAlchemy metadata and seeds default data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        await _seed_initial_users_and_cohorts(session)

async def check_db_health() -> Dict[str, Any]:
    """Health check ping verifying database connection and query latency."""
    t0 = datetime.datetime.now()
    try:
        async with async_session_factory() as session:
            await session.execute(select(func.count(UserModel.id)))
        latency_ms = round((datetime.datetime.now() - t0).total_seconds() * 1000, 2)
        return {
            "status": "healthy",
            "dialect": engine.dialect.name,
            "latency_ms": latency_ms
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

async def _seed_initial_users_and_cohorts(session: AsyncSession):
    """Seed initial admin, faculty, demo cohort and students if not present."""
    res = await session.execute(select(func.count(CohortModel.id)))
    count = res.scalar() or 0
    if count > 0:
        return

    # 1. Seed Default Admin User
    admin_user = UserModel(
        id="usr-admin-01",
        email="admin@college.edu",
        hashed_password=hash_password("Admin@Capstone2026"),
        role="admin",
        name="Dean of Academics",
        department="School of Computing",
        cohort_id="cohort-cse-2026-a"
    )
    session.add(admin_user)

    # 2. Seed Default Faculty User
    faculty_user = UserModel(
        id="usr-faculty-01",
        email="faculty@college.edu",
        hashed_password=hash_password("Faculty@Capstone2026"),
        role="faculty",
        name="Dr. V. Ramanathan (HOD)",
        department="Computer Science & Engineering",
        cohort_id="cohort-cse-2026-a"
    )
    session.add(faculty_user)

    # 3. Seed Default Cohort: "CSE Capstone Batch 2026 - Section A"
    cohort_id = "cohort-cse-2026-a"
    cohort = CohortModel(
        id=cohort_id,
        name="CSE Final Year - Capstone Cohort A",
        faculty_id=faculty_user.id,
        faculty_name=faculty_user.name,
        department="Computer Science & Engineering",
        academic_year="2025-2026"
    )
    session.add(cohort)

    # 4. Seed Demo Students
    demo_students = [
        {
            "id": "std-priya-01",
            "name": "Priya Sharma",
            "email": "priya.sharma@eng.univ.edu",
            "branch": "Computer Science & AI",
            "team_size": 2,
            "timeframe": 16,
            "hw": "CPU-only",
            "domains": ["Healthcare & Biomedical AI"],
            "skills": {"python": 4, "pytorch": 3, "onnx_runtime": 3, "fastapi": 2, "opencv": 2},
            "idea_id": "idea-001",
            "title": "EdgeMed: Real-Time Chest Radiograph Triage with INT8 Quantization",
            "domain": "Healthcare & Biomedical AI",
            "novelty": 82.5,
            "feasibility": 78.0,
            "hireability": 84.0,
            "drift": "Ahead of Schedule",
            "desc": "Hospital triage pipeline classifying 14 thoracic pathologies from DICOM images on CPU using INT8 ONNX models with Grad-CAM overlays."
        },
        {
            "id": "std-rohan-02",
            "name": "Rohan Deshmukh",
            "email": "rohan.d@eng.univ.edu",
            "branch": "Electronics & IoT Engineering",
            "team_size": 2,
            "timeframe": 14,
            "hw": "IoT hardware",
            "domains": ["Edge AI & TinyML / IoT"],
            "skills": {"embedded_c": 4, "esp32": 4, "tinyml": 3, "sensors_protocols": 3, "mqtt": 3},
            "idea_id": "idea-011",
            "title": "AeroSense: Ultra-Low-Power Wildfire Smoke Detection via TinyML Sensor Fusion",
            "domain": "Edge AI & TinyML / IoT",
            "novelty": 89.0,
            "feasibility": 82.0,
            "hireability": 76.5,
            "drift": "On Track",
            "desc": "Off-grid ESP32 sensor node fusing particulate matter and temperature with an onboard 12KB neural classifier."
        },
        {
            "id": "std-ananya-03",
            "name": "Ananya Iyer",
            "email": "ananya.iyer@eng.univ.edu",
            "branch": "Cybersecurity & Networks",
            "team_size": 1,
            "timeframe": 16,
            "hw": "CPU-only",
            "domains": ["Cybersecurity & Threat Intelligence"],
            "skills": {"golang": 3, "linux_admin": 4, "docker": 3, "python": 3},
            "idea_id": "idea-031",
            "title": "KernelShield: eBPF Real-Time Container Privilege Escalation Interceptor",
            "domain": "Cybersecurity & Threat Intelligence",
            "novelty": 94.0,
            "feasibility": 68.5,
            "hireability": 88.0,
            "drift": "On Track",
            "desc": "Linux security agent attaching eBPF tracepoints to syscalls to kill malicious processes breaking out of Docker namespaces."
        },
        {
            "id": "std-vikram-04",
            "name": "Vikram Malhotra",
            "email": "vikram.m@eng.univ.edu",
            "branch": "Computer Science & Engineering",
            "team_size": 3,
            "timeframe": 16,
            "hw": "CPU-only",
            "domains": ["FinTech & Fraud Analytics"],
            "skills": {"python": 4, "pytorch": 3, "postgresql": 3, "timescaledb": 2, "sql": 3},
            "idea_id": "idea-041",
            "title": "GraphFraud: Real-Time Anti-Money Laundering via Temporal Graph Neural Networks",
            "domain": "FinTech & Fraud Analytics",
            "novelty": 85.0,
            "feasibility": 74.0,
            "hireability": 91.5,
            "drift": "Behind Schedule (Milestone Slip Risk)",
            "desc": "Continuous graph learning engine tracking money laundering transaction rings across 500k bank accounts."
        },
        {
            "id": "std-aarav-05",
            "name": "Aarav Patel",
            "email": "aarav.p@eng.univ.edu",
            "branch": "Computer Science & Engineering",
            "team_size": 2,
            "timeframe": 16,
            "hw": "CPU-only",
            "domains": ["Healthcare & Biomedical AI"],
            "skills": {"python": 3, "pytorch": 3, "onnx_runtime": 2, "fastapi": 2},
            "idea_id": "idea-001",
            "title": "Chest X-Ray Pathology Classifier using Deep Learning and Grad-CAM",
            "domain": "Healthcare & Biomedical AI",
            "novelty": 38.0,
            "feasibility": 81.0,
            "hireability": 82.0,
            "drift": "On Track",
            "desc": "Classifying chest x-ray pathologies with Grad-CAM heatmap visualization."
        },
        {
            "id": "std-neha-06",
            "name": "Neha Verma",
            "email": "neha.v@eng.univ.edu",
            "branch": "Electrical & Clean Energy",
            "team_size": 2,
            "timeframe": 16,
            "hw": "CPU-only",
            "domains": ["Green Tech & Renewable Smart Grids"],
            "skills": {"python": 3, "pytorch": 3, "timescaledb": 2, "mqtt": 2},
            "idea_id": "idea-051",
            "title": "GridPulse: Physics-Informed Solar Inverter Telemetry and Islanding Prevention",
            "domain": "Green Tech & Renewable Smart Grids",
            "novelty": 88.0,
            "feasibility": 76.0,
            "hireability": 78.0,
            "drift": "Ahead of Schedule",
            "desc": "Hybrid neural forecasting and Kirchhoff law simulator managing bi-directional power flows in neighborhood microgrids."
        },
        {
            "id": "std-kabir-07",
            "name": "Kabir Mehta",
            "email": "kabir.m@eng.univ.edu",
            "branch": "Computer Science & Engineering",
            "team_size": 1,
            "timeframe": 12,
            "hw": "none",
            "domains": ["Developer Tooling & Program Analysis"],
            "skills": {"python": 4, "fastapi": 3, "react": 2},
            "idea_id": "idea-071",
            "title": "AST-Guard: Automated Static Analysis and Security Taint Engine for Python",
            "domain": "Developer Tooling & Program Analysis",
            "novelty": 91.0,
            "feasibility": 64.0,
            "hireability": 83.0,
            "drift": "Behind Schedule (Milestone Slip Risk)",
            "desc": "Abstract Syntax Tree (AST) visitor propagating untrusted user input into database and shell sinks to flag injection vulnerabilities."
        }
    ]

    for s in demo_students:
        # User account
        stu_user = UserModel(
            id=f"usr-{s['id']}",
            email=s["email"],
            hashed_password=hash_password("Student@Capstone2026"),
            role="student",
            name=s["name"],
            department=s["branch"],
            cohort_id=cohort_id
        )
        session.add(stu_user)

        # Student model
        stu = StudentModel(
            id=s["id"],
            user_id=stu_user.id,
            name=s["name"],
            email=encrypt_pii(s["email"]),
            branch=s["branch"],
            team_size=s["team_size"],
            timeframe_weeks=s["timeframe"],
            hardware_constraint=s["hw"],
            interest_domains=json.dumps(s["domains"]),
            skills_json=json.dumps(s["skills"]),
            selected_idea_id=s["idea_id"]
        )
        session.add(stu)

        # Cohort student link
        cs = CohortStudentModel(cohort_id=cohort_id, student_id=s["id"])
        session.add(cs)

        # Project model
        proj = ProjectModel(
            id=f"proj-{s['id']}",
            student_id=s["id"],
            student_name=s["name"],
            idea_id=s["idea_id"],
            title=s["title"],
            domain=s["domain"],
            problem_statement=s["desc"],
            mvp_features=json.dumps(["Core pipeline module", "Data validation", "REST API"]),
            stretch_features=json.dumps(["Real-time dashboard", "Cluster failover", "E2E tests"]),
            tech_stack=json.dumps(["Python", "FastAPI", "React"]),
            citations_json=json.dumps([]),
            novelty_score=s["novelty"],
            feasibility_score=s["feasibility"],
            hireability_score=s["hireability"],
            drift_status=s["drift"]
        )
        session.add(proj)

    await session.commit()

# -------------------------------------------------------------
# User Account Operations (Authentication & RBAC)
# -------------------------------------------------------------
async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Registers a new user account with hashed password."""
    async with async_session_factory() as session:
        existing = await session.execute(select(UserModel).where(UserModel.email == user_data["email"]))
        if existing.scalar_one_or_none():
            raise ValueError(f"User with email '{user_data['email']}' already exists.")

        user_id = user_data.get("id") or f"usr-{uuid.uuid4().hex[:10]}"
        user = UserModel(
            id=user_id,
            email=user_data["email"].strip().lower(),
            hashed_password=hash_password(user_data["password"]),
            role=user_data.get("role", "student"),
            name=user_data.get("name", "New User"),
            department=user_data.get("department", "Computer Science & Engineering"),
            cohort_id=user_data.get("cohort_id", "cohort-cse-2026-a")
        )
        session.add(user)

        # If user is a student, automatically initialize student profile record
        if user.role == "student":
            student_id = f"std-{user_id.replace('usr-', '')}"
            student = StudentModel(
                id=student_id,
                user_id=user_id,
                name=user.name,
                email=encrypt_pii(user.email),
                branch=user.department,
                team_size=1,
                timeframe_weeks=16,
                hardware_constraint="CPU-only",
                interest_domains=json.dumps([]),
                skills_json=json.dumps({}),
                selected_idea_id=None
            )
            session.add(student)
            session.add(CohortStudentModel(cohort_id=user.cohort_id, student_id=student_id))

        await session.commit()
        return {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name,
            "department": user.department,
            "cohort_id": user.cohort_id
        }

async def get_user_by_email(email: str) -> Optional[UserModel]:
    """Retrieves user model by email."""
    async with async_session_factory() as session:
        res = await session.execute(select(UserModel).where(UserModel.email == email.strip().lower()))
        return res.scalar_one_or_none()

async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves user by ID."""
    async with async_session_factory() as session:
        res = await session.execute(select(UserModel).where(UserModel.id == user_id))
        user = res.scalar_one_or_none()
        if not user:
            return None
        return {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name,
            "department": user.department,
            "cohort_id": user.cohort_id,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }

async def list_all_users() -> List[Dict[str, Any]]:
    """Admin function: list all registered users."""
    async with async_session_factory() as session:
        res = await session.execute(select(UserModel).order_by(UserModel.created_at.desc()))
        users = res.scalars().all()
        return [{
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "name": u.name,
            "department": u.department,
            "cohort_id": u.cohort_id,
            "created_at": u.created_at.isoformat() if u.created_at else None
        } for u in users]

async def update_user_role(user_id: str, new_role: str) -> bool:
    """Admin function: update role for user."""
    async with async_session_factory() as session:
        res = await session.execute(select(UserModel).where(UserModel.id == user_id))
        user = res.scalar_one_or_none()
        if not user:
            return False
        user.role = new_role
        await session.commit()
        return True

# -------------------------------------------------------------
# Cohort Operations
# -------------------------------------------------------------
async def list_cohorts(department: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lists cohorts, optionally filtered by faculty department."""
    async with async_session_factory() as session:
        stmt = select(CohortModel)
        if department:
            stmt = stmt.where(CohortModel.department == department)
        res = await session.execute(stmt)
        cohorts = res.scalars().all()
        return [{
            "id": c.id,
            "name": c.name,
            "faculty_id": c.faculty_id,
            "faculty_name": c.faculty_name,
            "department": c.department,
            "academic_year": c.academic_year
        } for c in cohorts]

async def create_cohort(data: Dict[str, Any]) -> Dict[str, Any]:
    """Admin function: create new cohort."""
    async with async_session_factory() as session:
        cohort = CohortModel(
            id=data.get("id") or f"cohort-{uuid.uuid4().hex[:8]}",
            name=data["name"],
            faculty_id=data.get("faculty_id"),
            faculty_name=data.get("faculty_name", "Faculty Advisor"),
            department=data.get("department", "Computer Science & Engineering"),
            academic_year=data.get("academic_year", "2025-2026")
        )
        session.add(cohort)
        await session.commit()
        return {
            "id": cohort.id,
            "name": cohort.name,
            "faculty_name": cohort.faculty_name,
            "department": cohort.department,
            "academic_year": cohort.academic_year
        }

# -------------------------------------------------------------
# Student Profile Persistence
# -------------------------------------------------------------
async def save_student_profile(student_data: Dict[str, Any]):
    """Saves or updates student profile."""
    async with async_session_factory() as session:
        sid = student_data["id"]
        res = await session.execute(select(StudentModel).where(StudentModel.id == sid))
        student = res.scalar_one_or_none()

        encrypted_email = encrypt_pii(student_data.get("email", "")) if student_data.get("email") else ""

        if not student:
            student = StudentModel(
                id=sid,
                user_id=student_data.get("user_id"),
                name=student_data.get("name", "Student Engineer"),
                email=encrypted_email,
                branch=student_data.get("branch", "Computer Science"),
                team_size=student_data.get("team_size", 1),
                timeframe_weeks=student_data.get("timeframe_weeks", 16),
                hardware_constraint=student_data.get("hardware_constraint", "CPU-only"),
                interest_domains=json.dumps(student_data.get("interest_domains", [])),
                skills_json=json.dumps(student_data.get("skills", {})),
                selected_idea_id=student_data.get("selected_idea_id")
            )
            session.add(student)
        else:
            student.name = student_data.get("name", student.name)
            if student_data.get("email"):
                student.email = encrypted_email
            student.branch = student_data.get("branch", student.branch)
            student.team_size = student_data.get("team_size", student.team_size)
            student.timeframe_weeks = student_data.get("timeframe_weeks", student.timeframe_weeks)
            student.hardware_constraint = student_data.get("hardware_constraint", student.hardware_constraint)
            student.interest_domains = json.dumps(student_data.get("interest_domains", []))
            student.skills_json = json.dumps(student_data.get("skills", {}))
            if "selected_idea_id" in student_data:
                student.selected_idea_id = student_data.get("selected_idea_id")

        await session.commit()

async def get_student_profile(student_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves student profile with decrypted PII."""
    async with async_session_factory() as session:
        res = await session.execute(select(StudentModel).where(StudentModel.id == student_id))
        student = res.scalar_one_or_none()
        if not student:
            return None
        return {
            "id": student.id,
            "user_id": student.user_id,
            "name": student.name,
            "email": decrypt_pii(student.email) if student.email else "",
            "branch": student.branch,
            "team_size": student.team_size,
            "timeframe_weeks": student.timeframe_weeks,
            "hardware_constraint": student.hardware_constraint,
            "interest_domains": json.loads(student.interest_domains) if student.interest_domains else [],
            "skills": json.loads(student.skills_json) if student.skills_json else {},
            "selected_idea_id": student.selected_idea_id
        }

# -------------------------------------------------------------
# Project Persistence
# -------------------------------------------------------------
async def save_project(project_data: Dict[str, Any]):
    """Saves or updates project record."""
    async with async_session_factory() as session:
        pid = project_data["id"]
        res = await session.execute(select(ProjectModel).where(ProjectModel.id == pid))
        project = res.scalar_one_or_none()

        if not project:
            project = ProjectModel(
                id=pid,
                student_id=project_data["student_id"],
                student_name=project_data.get("student_name", "Student"),
                idea_id=project_data["idea_id"],
                title=project_data["title"],
                domain=project_data["domain"],
                problem_statement=project_data.get("problem_statement", ""),
                mvp_features=json.dumps(project_data.get("mvp_features", [])),
                stretch_features=json.dumps(project_data.get("stretch_features", [])),
                tech_stack=json.dumps(project_data.get("tech_stack", [])),
                citations_json=json.dumps(project_data.get("citations", [])),
                novelty_score=project_data.get("novelty_score", 85.0),
                feasibility_score=project_data.get("feasibility_score", 80.0),
                hireability_score=project_data.get("hireability_score", 82.0),
                drift_status=project_data.get("drift_status", "On Track"),
                repo_url=project_data.get("repo_url", "")
            )
            session.add(project)
        else:
            project.title = project_data.get("title", project.title)
            project.domain = project_data.get("domain", project.domain)
            project.problem_statement = project_data.get("problem_statement", project.problem_statement)
            project.mvp_features = json.dumps(project_data.get("mvp_features", []))
            project.stretch_features = json.dumps(project_data.get("stretch_features", []))
            project.tech_stack = json.dumps(project_data.get("tech_stack", []))
            project.citations_json = json.dumps(project_data.get("citations", []))
            project.novelty_score = project_data.get("novelty_score", project.novelty_score)
            project.feasibility_score = project_data.get("feasibility_score", project.feasibility_score)
            project.hireability_score = project_data.get("hireability_score", project.hireability_score)
            project.drift_status = project_data.get("drift_status", project.drift_status)
            project.repo_url = project_data.get("repo_url", project.repo_url)

        await session.commit()

async def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves project record by project_id."""
    async with async_session_factory() as session:
        res = await session.execute(select(ProjectModel).where(ProjectModel.id == project_id))
        proj = res.scalar_one_or_none()
        if not proj:
            return None
        return {
            "id": proj.id,
            "student_id": proj.student_id,
            "student_name": proj.student_name,
            "idea_id": proj.idea_id,
            "title": proj.title,
            "domain": proj.domain,
            "problem_statement": proj.problem_statement,
            "mvp_features": json.loads(proj.mvp_features) if proj.mvp_features else [],
            "stretch_features": json.loads(proj.stretch_features) if proj.stretch_features else [],
            "tech_stack": json.loads(proj.tech_stack) if proj.tech_stack else [],
            "citations": json.loads(proj.citations_json) if proj.citations_json else [],
            "novelty_score": proj.novelty_score,
            "feasibility_score": proj.feasibility_score,
            "hireability_score": proj.hireability_score,
            "drift_status": proj.drift_status,
            "repo_url": proj.repo_url
        }

# -------------------------------------------------------------
# Proposal Cache Operations
# -------------------------------------------------------------
async def get_generation_cache(cache_key: str) -> Optional[Dict[str, Any]]:
    """Fetches cached proposal data."""
    async with async_session_factory() as session:
        res = await session.execute(select(GenerationCacheModel).where(GenerationCacheModel.cache_key == cache_key))
        item = res.scalar_one_or_none()
        if item:
            return json.loads(item.data_json)
        return None

async def set_generation_cache(cache_key: str, data: Dict[str, Any]):
    """Saves generated proposal to cache."""
    async with async_session_factory() as session:
        res = await session.execute(select(GenerationCacheModel).where(GenerationCacheModel.cache_key == cache_key))
        item = res.scalar_one_or_none()
        if not item:
            item = GenerationCacheModel(cache_key=cache_key, data_json=json.dumps(data))
            session.add(item)
        else:
            item.data_json = json.dumps(data)
        await session.commit()

# -------------------------------------------------------------
# Cohort Student Queries (Scoped for Faculty)
# -------------------------------------------------------------
async def get_cohort_students(cohort_id: str = "cohort-cse-2026-a") -> List[Dict[str, Any]]:
    """Retrieves all students and active projects for a given cohort."""
    async with async_session_factory() as session:
        stmt = (
            select(
                StudentModel.id, StudentModel.name, StudentModel.email, StudentModel.branch,
                StudentModel.team_size, StudentModel.hardware_constraint,
                ProjectModel.id.label("project_id"), ProjectModel.title, ProjectModel.domain,
                ProjectModel.novelty_score, ProjectModel.feasibility_score,
                ProjectModel.hireability_score, ProjectModel.drift_status
            )
            .join(CohortStudentModel, StudentModel.id == CohortStudentModel.student_id)
            .outerjoin(ProjectModel, StudentModel.id == ProjectModel.student_id)
            .where(CohortStudentModel.cohort_id == cohort_id)
        )
        rows = (await session.execute(stmt)).all()
        result = []
        for r in rows:
            result.append({
                "student_id": r[0],
                "student_name": r[1],
                "email": decrypt_pii(r[2]) if r[2] else "",
                "branch": r[3],
                "team_size": r[4],
                "hardware_constraint": r[5],
                "project_id": r[6],
                "idea_title": r[7] or "Selecting Project...",
                "domain": r[8] or "Pending",
                "novelty_score": r[9] if r[9] is not None else 80.0,
                "feasibility_score": r[10] if r[10] is not None else 75.0,
                "hireability_score": r[11] if r[11] is not None else 78.0,
                "drift_status": r[12] or "On Track"
            })
        return result

# -------------------------------------------------------------
# Mentor Messages
# -------------------------------------------------------------
async def save_mentor_message(project_id: str, sender: str, message: str):
    """Logs mentor chat message to database."""
    async with async_session_factory() as session:
        msg = MentorMessageModel(
            project_id=project_id,
            sender=sender,
            message=message
        )
        session.add(msg)
        await session.commit()

async def get_mentor_history(project_id: str) -> List[Dict[str, Any]]:
    """Retrieves conversation history for a given project."""
    async with async_session_factory() as session:
        res = await session.execute(
            select(MentorMessageModel)
            .where(MentorMessageModel.project_id == project_id)
            .order_by(MentorMessageModel.id.asc())
        )
        messages = res.scalars().all()
        return [
            {
                "role": m.sender,
                "content": m.message,
                "timestamp": m.timestamp.isoformat() if m.timestamp else None
            }
            for m in messages
        ]

# -------------------------------------------------------------
# Privacy / Data Deletion (FERPA / GDPR Right-to-be-Forgotten)
# -------------------------------------------------------------
async def delete_student_data(student_id: str) -> Dict[str, Any]:
    """Permanently deletes student profile, projects, mentor chats, and links."""
    async with async_session_factory() as session:
        # Delete mentor messages
        proj_res = await session.execute(select(ProjectModel.id).where(ProjectModel.student_id == student_id))
        proj_ids = proj_res.scalars().all()
        for pid in proj_ids:
            await session.execute(delete(MentorMessageModel).where(MentorMessageModel.project_id == pid))

        # Delete projects
        await session.execute(delete(ProjectModel).where(ProjectModel.student_id == student_id))

        # Delete cohort link
        await session.execute(delete(CohortStudentModel).where(CohortStudentModel.student_id == student_id))

        # Delete student record
        await session.execute(delete(StudentModel).where(StudentModel.id == student_id))

        await session.commit()
        return {"status": "success", "message": f"All data for student {student_id} permanently erased."}

# -------------------------------------------------------------
# Kanban Task Board Operations (Feature 4)
# -------------------------------------------------------------
STACK_TASKS_FILE = os.path.join(os.path.dirname(__file__), "data", "stack_boilerplate_tasks.json")

async def get_project_tasks(project_id: str) -> List[Dict[str, Any]]:
    """Retrieves all Kanban tasks for a project, auto-seeding if none exist."""
    async with async_session_factory() as session:
        res = await session.execute(
            select(TaskModel)
            .where(TaskModel.project_id == project_id)
            .order_by(TaskModel.linked_week.asc(), TaskModel.created_at.asc())
        )
        tasks = res.scalars().all()
        if tasks:
            return [
                {
                    "id": t.id,
                    "project_id": t.project_id,
                    "title": t.title,
                    "status": t.status,
                    "linked_week": t.linked_week,
                    "is_stretch": bool(t.is_stretch),
                    "created_at": t.created_at.isoformat() if t.created_at else None
                }
                for t in tasks
            ]

    # If empty, auto-seed from project blueprint & tech stack
    proj = await get_project(project_id)
    if proj:
        return await seed_project_tasks_from_roadmap(
            project_id=project_id,
            tech_stack=proj.get("tech_stack", []),
            mvp_features=proj.get("mvp_features", []),
            stretch_features=proj.get("stretch_features", [])
        )
    return []

async def create_project_task(
    project_id: str,
    title: str,
    status: str = "Not Started",
    linked_week: int = 1,
    is_stretch: bool = False
) -> Dict[str, Any]:
    """Creates a new Kanban task for a project."""
    async with async_session_factory() as session:
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        task = TaskModel(
            id=task_id,
            project_id=project_id,
            title=title.strip(),
            status=status,
            linked_week=linked_week,
            is_stretch=1 if is_stretch else 0
        )
        session.add(task)
        await session.commit()
        return {
            "id": task.id,
            "project_id": task.project_id,
            "title": task.title,
            "status": task.status,
            "linked_week": task.linked_week,
            "is_stretch": bool(task.is_stretch),
            "created_at": task.created_at.isoformat() if task.created_at else None
        }

async def update_task_status(task_id: str, new_status: str) -> Optional[Dict[str, Any]]:
    """Updates the status of a Kanban task."""
    valid_statuses = ["Not Started", "In Progress", "Completed"]
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status '{new_status}'. Must be one of: {valid_statuses}")

    async with async_session_factory() as session:
        res = await session.execute(select(TaskModel).where(TaskModel.id == task_id))
        task = res.scalar_one_or_none()
        if not task:
            return None
        task.status = new_status
        await session.commit()
        return {
            "id": task.id,
            "project_id": task.project_id,
            "title": task.title,
            "status": task.status,
            "linked_week": task.linked_week,
            "is_stretch": bool(task.is_stretch)
        }

async def seed_project_tasks_from_roadmap(
    project_id: str,
    tech_stack: Optional[List[str]] = None,
    mvp_features: Optional[List[str]] = None,
    stretch_features: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """Generates initial task list from roadmap deliverables and stack boilerplate mapping."""
    stack_tasks_map = {}
    if os.path.exists(STACK_TASKS_FILE):
        try:
            with open(STACK_TASKS_FILE, "r") as f:
                data = json.load(f)
                stack_tasks_map = data.get("tasks_by_technology", {})
        except Exception as e:
            print(f"[Database] Error reading stack boilerplate tasks: {e}")

    generated_tasks = []

    # 1. Add roadmap deliverable tasks from MVP features
    if mvp_features:
        for idx, feat in enumerate(mvp_features[:4]):
            week = 2 + (idx * 3) # spread across early-to-mid sprints
            generated_tasks.append({
                "title": f"Implement {feat}",
                "week": min(16, week),
                "is_stretch": False
            })

    # 2. Add roadmap deliverable tasks from Stretch features
    if stretch_features:
        for idx, feat in enumerate(stretch_features[:3]):
            week = 10 + (idx * 2) # mid-to-late sprints
            generated_tasks.append({
                "title": f"Stretch: {feat}",
                "week": min(16, week),
                "is_stretch": True
            })

    # 3. Add stack-specific boilerplate tasks
    if tech_stack:
        for tech in tech_stack:
            matching_key = next((k for k in stack_tasks_map.keys() if k.lower() in tech.lower()), None)
            if matching_key:
                for b_task in stack_tasks_map[matching_key][:2]:
                    generated_tasks.append({
                        "title": f"[{tech}] {b_task['title']}",
                        "week": b_task.get("week", 1),
                        "is_stretch": b_task.get("is_stretch", False)
                    })

    # Fallback if no features or stack
    if not generated_tasks:
        generated_tasks = [
            {"title": "Initialize project repository & architecture baseline", "week": 1, "is_stretch": false},
            {"title": "Data ingestion and validation pipeline module", "week": 3, "is_stretch": false},
            {"title": "Core algorithmic inference service integration", "week": 7, "is_stretch": false},
            {"title": "REST API endpoints and automated unit tests", "week": 10, "is_stretch": false},
            {"title": "Interactive user interface and visualization dashboard", "week": 13, "is_stretch": false},
            {"title": "Final benchmark profiling and viva voce oral defense prep", "week": 16, "is_stretch": false}
        ]

    # Persist to database
    persisted = []
    async with async_session_factory() as session:
        for t_info in generated_tasks:
            task = TaskModel(
                id=f"task-{uuid.uuid4().hex[:8]}",
                project_id=project_id,
                title=t_info["title"],
                status="Not Started",
                linked_week=t_info["week"],
                is_stretch=1 if t_info["is_stretch"] else 0
            )
            session.add(task)
            persisted.append({
                "id": task.id,
                "project_id": task.project_id,
                "title": task.title,
                "status": task.status,
                "linked_week": task.linked_week,
                "is_stretch": bool(task.is_stretch)
            })
        await session.commit()

    return persisted

async def get_project_task_completion_stats(project_id: str) -> Dict[str, Any]:
    """Computes task board completion stats for feeding into drift calculation."""
    async with async_session_factory() as session:
        res = await session.execute(select(TaskModel).where(TaskModel.project_id == project_id))
        tasks = res.scalars().all()
        if not tasks:
            return {
                "total_tasks": 0,
                "completed_tasks": 0,
                "in_progress_tasks": 0,
                "not_started_tasks": 0,
                "completion_percentage": 0.0,
                "drift_status": "On Track"
            }

        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == "Completed")
        in_progress = sum(1 for t in tasks if t.status == "In Progress")
        not_started = sum(1 for t in tasks if t.status == "Not Started")
        pct = round((completed / max(1, total)) * 100.0, 1)

        # Baseline expected: ~45% at midpoint
        drift_status = "Ahead of Schedule" if pct >= 60.0 else (
            "Behind Schedule (Milestone Slip Risk)" if pct < 20.0 else "On Track"
        )

        return {
            "total_tasks": total,
            "completed_tasks": completed,
            "in_progress_tasks": in_progress,
            "not_started_tasks": not_started,
            "completion_percentage": pct,
            "drift_status": drift_status
        }


