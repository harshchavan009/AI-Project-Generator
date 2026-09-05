from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

# -------------------------------------------------------------
# Skill Taxonomy Schemas
# -------------------------------------------------------------
class SkillItem(BaseModel):
    id: str
    name: str
    difficulty: int = 3
    description: str = ""

class TaxonomyCategory(BaseModel):
    id: str
    name: str
    description: str = ""
    skills: List[SkillItem]

class TaxonomyResponse(BaseModel):
    version: str = "1.0.0"
    categories: List[TaxonomyCategory]

# -------------------------------------------------------------
# Student Profile Schemas
# -------------------------------------------------------------
class StudentProfile(BaseModel):
    id: Optional[str] = None
    name: str = "Student Engineer"
    email: Optional[str] = ""
    branch: str = "Computer Science & Engineering"
    team_size: int = Field(default=1, ge=1, le=6)
    timeframe_weeks: int = Field(default=16, ge=4, le=52)
    hardware_constraint: str = Field(default="CPU-only", description="CPU-only | GPU available | IoT hardware | none")
    interest_domains: List[str] = Field(default_factory=list)
    skills: Dict[str, int] = Field(default_factory=dict, description="skill_id -> self-rated proficiency 1-5")
    selected_idea_id: Optional[str] = None

# -------------------------------------------------------------
# Matching & Scoring Schemas
# -------------------------------------------------------------
class MatchRequest(BaseModel):
    profile: StudentProfile
    relevance_weight: float = 0.55
    feasibility_weight: float = 0.45
    limit: int = 30

class SkillGapItem(BaseModel):
    skill_id: str
    skill_name: str
    required_level: int
    actual_level: int
    deficit: int
    status: str
    difficulty: int

class LearningPathwayNode(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    estimated_hours: float
    target_proficiency: int
    current_proficiency: int
    is_prerequisite_ancestor: bool

class SkillCoverageBreakdown(BaseModel):
    coverage_ratio: float
    coverage_percentage: float
    matched_count: int
    total_required: int
    gap_severity: float
    missing_skills: List[str]
    weak_skills: List[str]
    gap_breakdown: List[SkillGapItem]
    topological_learning_pathway: List[LearningPathwayNode]
    estimated_bridging_weeks: float
    estimated_bridging_hours: float

class FeasibilityFactor(BaseModel):
    factor: str
    impact: float
    status: str
    explanation: str

class FeasibilityResult(BaseModel):
    feasibility_score: float
    feasibility_band: str
    rule_score: float
    ml_completion_probability: float
    factor_breakdown: List[FeasibilityFactor]
    rules_applied_count: int

class NearestMatch(BaseModel):
    id: str
    title: str
    source_type: str
    domain: str
    similarity_score: float
    similarity_percentage: float
    excerpt: str

class NoveltyResult(BaseModel):
    novelty_score: float
    max_similarity_percentage: float
    threshold_percentage: float
    is_high_overlap: bool
    status: str
    top_matches: List[NearestMatch]
    corpus_size_evaluated: int

class StackMarketInsight(BaseModel):
    technology: str
    market_demand_frequency: float
    market_percentage: float
    market_insight: str

class HireabilityResult(BaseModel):
    hireability_score: float
    average_market_frequency: float
    top_market_driver: str
    stack_insights: List[StackMarketInsight]
    source: str

class MatchedIdeaResponse(BaseModel):
    id: str
    title: str
    domain: str
    description: str
    required_skills: Dict[str, int]
    typical_timeline_weeks: int
    hardware_requirement: str
    component_count: int
    novel_algorithm_required: bool
    tech_stack: List[str]
    mvp_features: List[str]
    stretch_features: List[str]
    combined_score: float
    relevance_score: float
    domain_similarity_percentage: float
    is_domain_match: bool
    skill_coverage: SkillCoverageBreakdown
    feasibility: FeasibilityResult
    novelty: NoveltyResult
    hireability: HireabilityResult

# -------------------------------------------------------------
# Novelty Checking Endpoint Schemas
# -------------------------------------------------------------
class NoveltyCheckRequest(BaseModel):
    title: str
    description: str
    top_k: int = 3
    threshold: float = 0.72

# -------------------------------------------------------------
# RAG Grounded Proposal Schemas
# -------------------------------------------------------------
class GroundIdeaRequest(BaseModel):
    idea: Dict[str, Any]
    profile: StudentProfile
    api_key: Optional[str] = ""
    provider: Optional[str] = "auto"

class CitationItem(BaseModel):
    id: str
    title: str
    authors: str
    year: int
    url: str
    type: str
    summary: str
    relevance_score: float

class GroundedProposalResponse(BaseModel):
    idea_id: str
    grounded_problem_statement: str
    mvp_features: List[str]
    stretch_features: List[str]
    tech_stack: List[str]
    tech_stack_rationale: List[str]
    citations: List[CitationItem]
    generation_mode: str

# -------------------------------------------------------------
# Mentor Chat & AST Viva Schemas
# -------------------------------------------------------------
class MentorChatPayload(BaseModel):
    project_id: str
    project_title: str
    project_domain: str
    message: str
    skill_gaps: List[str] = Field(default_factory=list)
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    api_key: Optional[str] = ""

class AstVivaRequest(BaseModel):
    source_code: str
    file_path: Optional[str] = "main.py"

class VivaQuestionItem(BaseModel):
    category: str
    question: str
    evaluated_construct: str
    expected_keywords: List[str]

class AstVivaResponse(BaseModel):
    valid: bool
    file_path: str
    stats: Dict[str, Any]
    classes: List[Dict[str, Any]]
    functions: List[str]
    async_functions: List[str]
    viva_questions: List[VivaQuestionItem]

# -------------------------------------------------------------
# GitHub Progress Tracking Schemas
# -------------------------------------------------------------
class GitHubDriftRequest(BaseModel):
    repo_url_or_name: str = "sample-student/capstone-repo"
    token: Optional[str] = None
    total_weeks: int = 16
    current_week: int = 7

# -------------------------------------------------------------
# Faculty & Cohort Oversight Schemas
# -------------------------------------------------------------
class CohortStudentItem(BaseModel):
    student_id: str
    student_name: str
    email: str
    branch: str
    team_size: int
    hardware_constraint: str
    project_id: Optional[str]
    idea_title: str
    domain: str
    novelty_score: float
    feasibility_score: float
    hireability_score: float
    drift_status: str

class DuplicateClusterStudent(BaseModel):
    student_id: str
    student_name: str
    idea_title: str
    domain: str

class DuplicateCluster(BaseModel):
    cluster_id: str
    average_similarity: float
    average_similarity_percentage: float
    warning_level: str
    students: List[DuplicateClusterStudent]

class HistogramBin(BaseModel):
    range_label: str
    min_val: float
    max_val: float
    count: int

class DifficultyDistributionResponse(BaseModel):
    total_students: int
    feasibility_mean: float
    feasibility_median: float
    novelty_mean: float
    feasibility_histogram: List[HistogramBin]
    novelty_histogram: List[HistogramBin]
    batch_skew_assessment: str

# -------------------------------------------------------------
# Authentication & Authorization Schemas
# -------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = "Student Engineer"
    role: str = "student" # student, faculty, admin
    department: str = "Computer Science & Engineering"
    cohort_id: str = "cohort-cse-2026-a"

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    email: str
    name: str
    credential_token: Optional[str] = ""

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    name: str
    department: str
    cohort_id: str

class AuthResponse(BaseModel):
    status: str = "success"
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CreateCohortRequest(BaseModel):
    name: str
    department: str = "Computer Science & Engineering"
    academic_year: str = "2025-2026"
    faculty_name: Optional[str] = "Faculty Advisor"

class UpdateRoleRequest(BaseModel):
    role: str

# -------------------------------------------------------------
# Advanced Features Schemas
# -------------------------------------------------------------
class OriginalityTransformRequest(BaseModel):
    idea_text: str
    domain: Optional[str] = ""
    threshold: float = 60.0

class OriginalityTransformResponse(BaseModel):
    original_idea: str
    original_novelty_score: float
    detected_domain: str
    enhancement_patterns_applied: List[Dict[str, Any]]
    upgraded_title: str
    upgraded_description: str
    projected_novelty_score: float
    improvement_delta: float
    status: str = "success"

class FreeTextFeasibilityRequest(BaseModel):
    idea_text: str
    team_size: int = 1
    timeframe_weeks: int = 16
    hardware_constraint: str = "CPU-only"
    student_skills: Dict[str, int] = Field(default_factory=dict)

class FreeTextFeasibilityResponse(BaseModel):
    idea_text: str
    feasibility_verdict: str
    feasibility_score: float
    failing_factors: List[str]
    structural_flags: List[str]
    inferred_requirements: Dict[str, Any]
    scoped_down_alternative: Optional[Dict[str, Any]] = None
    status: str = "success"

class EvolutionLadderRequest(BaseModel):
    idea_text: str
    domain: Optional[str] = ""

class EvolutionLadderLevel(BaseModel):
    level: int
    level_name: str
    title: str
    description: str
    added_capabilities: List[str]
    added_tech_stack: List[str]
    estimated_weeks: int
    feasibility_score: float
    novelty_score: float

class EvolutionLadderResponse(BaseModel):
    category: str
    category_name: str
    original_idea: str
    ladder: List[EvolutionLadderLevel]
    status: str = "success"

class TaskCreateRequest(BaseModel):
    title: str
    status: str = "Not Started"
    linked_week: int = 1
    is_stretch: bool = False

class TaskUpdateRequest(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    linked_week: Optional[int] = None
    is_stretch: Optional[bool] = None

class TaskResponse(BaseModel):
    id: str
    project_id: str
    title: str
    status: str
    linked_week: int
    is_stretch: bool
    created_at: str

class TaskBoardResponse(BaseModel):
    project_id: str
    tasks: List[TaskResponse]
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    not_started_tasks: int
    completion_percentage: float
    drift_status: str
    status: str = "success"

class DatasetFindRequest(BaseModel):
    idea_text: str
    domain: Optional[str] = ""
    top_k: int = 4

class DatasetItem(BaseModel):
    id: str
    name: str
    domain: str
    source: str
    url: str
    license: str
    size: str
    columns_fields: List[str]
    target_variables: List[str]
    suitability_notes: str
    similarity_score: float

class DatasetFindResponse(BaseModel):
    matched_datasets: List[DatasetItem]
    match_found: bool
    message: str
    classified_domain: str
    status: str = "success"

