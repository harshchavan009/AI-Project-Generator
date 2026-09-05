export interface SkillItem {
  id: string;
  name: string;
  difficulty: number;
  description?: string;
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  description: string;
  skills: SkillItem[];
}

export interface StudentProfile {
  id?: string;
  name: string;
  email?: string;
  branch: string;
  team_size: number;
  timeframe_weeks: number;
  hardware_constraint: "CPU-only" | "GPU available" | "IoT hardware" | "none";
  interest_domains: string[];
  skills: Record<string, number>; // skill_id -> 1..5
  selected_idea_id?: string;
}

export interface SkillGapItem {
  skill_id: string;
  skill_name: string;
  required_level: number;
  actual_level: number;
  deficit: number;
  status: "missing" | "weak";
  difficulty: number;
}

export interface LearningPathwayNode {
  skill_id: string;
  skill_name: string;
  category: string;
  estimated_hours: number;
  target_proficiency: number;
  current_proficiency: number;
  is_prerequisite_ancestor: boolean;
}

export interface SkillCoverageBreakdown {
  coverage_ratio: number;
  coverage_percentage: number;
  matched_count: number;
  total_required: number;
  gap_severity: number;
  missing_skills: string[];
  weak_skills: string[];
  gap_breakdown: SkillGapItem[];
  topological_learning_pathway: LearningPathwayNode[];
  estimated_bridging_weeks: number;
  estimated_bridging_hours: number;
}

export interface FeasibilityFactor {
  factor: string;
  impact: number;
  status: "PASS" | "CREDIT" | "PENALTY";
  explanation: string;
}

export interface FeasibilityResult {
  feasibility_score: number;
  feasibility_band: "HIGH" | "MODERATE" | "LOW (HIGH RISK)";
  rule_score: number;
  ml_completion_probability: number;
  factor_breakdown: FeasibilityFactor[];
  rules_applied_count: number;
}

export interface NearestMatch {
  id: string;
  title: string;
  source_type: string;
  domain: string;
  similarity_score: number;
  similarity_percentage: number;
  excerpt: string;
}

export interface NoveltyResult {
  novelty_score: number;
  max_similarity_percentage: number;
  threshold_percentage: number;
  is_high_overlap: boolean;
  status: string;
  top_matches: NearestMatch[];
  corpus_size_evaluated: number;
}

export interface StackMarketInsight {
  technology: string;
  market_demand_frequency: number;
  market_percentage: number;
  market_insight: string;
}

export interface HireabilityResult {
  hireability_score: number;
  average_market_frequency: number;
  top_market_driver: string;
  stack_insights: StackMarketInsight[];
  source: string;
}

export interface ProjectIdea {
  id: string;
  title: string;
  domain: string;
  description: string;
  required_skills: Record<string, number>;
  typical_timeline_weeks: number;
  hardware_requirement: string;
  component_count: number;
  novel_algorithm_required: boolean;
  tech_stack: string[];
  mvp_features: string[];
  stretch_features: string[];
  
  // Explainable Deterministic Scores
  combined_score: number;
  relevance_score: number;
  domain_similarity_percentage: number;
  is_domain_match: boolean;
  skill_coverage: SkillCoverageBreakdown;
  feasibility: FeasibilityResult;
  novelty: NoveltyResult;
  hireability: HireabilityResult;
}

export interface CitationItem {
  id: string;
  title: string;
  authors: string;
  year: number;
  url: string;
  type: string;
  summary: string;
  relevance_score: number;
}

export interface GroundedProposal {
  idea_id: string;
  grounded_problem_statement: string;
  mvp_features: string[];
  stretch_features: string[];
  tech_stack: string[];
  tech_stack_rationale: string[];
  citations: CitationItem[];
  generation_mode: string;
}

export interface VivaQuestionItem {
  category: string;
  question: string;
  evaluated_construct: string;
  expected_keywords: string[];
}

export interface AstVivaResponse {
  valid: boolean;
  file_path: string;
  stats: {
    detected_modules: string[];
    function_count: number;
    async_function_count: number;
    class_count: number;
    has_context_managers: boolean;
    has_exception_handling: boolean;
  };
  classes: { name: string; bases: string[] }[];
  functions: string[];
  async_functions: string[];
  viva_questions: VivaQuestionItem[];
}

export interface CommitItem {
  sha: string;
  message: string;
  date: string;
  author: string;
}

export interface TimelineWeek {
  week_number: number;
  title: string;
  is_completed: boolean;
  is_current: boolean;
  planned_deliverable: string;
  commits_logged: number;
}

export interface GitHubDriftAnalysis {
  repository: string;
  is_live_github: boolean;
  current_week: number;
  total_weeks: number;
  expected_progress_percentage: number;
  actual_progress_percentage: number;
  drift_status: string;
  drift_badge: string;
  drift_color: string;
  drift_delta_days: number;
  total_commits: number;
  recent_commits: CommitItem[];
  timeline_overlay: TimelineWeek[];
}

export interface CohortStudent {
  student_id: string;
  student_name: string;
  email: string;
  branch: string;
  team_size: number;
  hardware_constraint: string;
  project_id?: string;
  idea_title: string;
  domain: string;
  novelty_score: number;
  feasibility_score: number;
  hireability_score: number;
  drift_status: string;
}

export interface DuplicateClusterStudent {
  student_id: string;
  student_name: string;
  idea_title: string;
  domain: string;
}

export interface DuplicateCluster {
  cluster_id: string;
  average_similarity: number;
  average_similarity_percentage: number;
  warning_level: "CRITICAL" | "HIGH" | "MODERATE";
  students: DuplicateClusterStudent[];
}

export interface HistogramBin {
  range_label: string;
  min_val: number;
  max_val: number;
  count: number;
}

export interface DifficultyDistribution {
  total_students: number;
  feasibility_mean: number;
  novelty_mean: number;
  feasibility_histogram: HistogramBin[];
  novelty_histogram: HistogramBin[];
  batch_skew_assessment: string;
}

// -------------------------------------------------------------
// Advanced Feature Extensions
// -------------------------------------------------------------
export interface EnhancementPattern {
  name: string;
  description: string;
  added_tech: string[];
}

export interface OriginalityTransformResponse {
  original_idea: string;
  original_novelty_score: number;
  detected_domain: string;
  enhancement_patterns_applied: EnhancementPattern[];
  upgraded_title: string;
  upgraded_description: string;
  projected_novelty_score: number;
  improvement_delta: number;
  status: string;
}

export interface ScopedDownAlternative {
  title: string;
  domain: string;
  description: string;
  suggested_tech: string[];
  rationale: string;
}

export interface FreeTextFeasibilityResponse {
  idea_text: string;
  feasibility_verdict: "High" | "Moderate" | "Low";
  feasibility_score: number;
  failing_factors: string[];
  structural_flags: string[];
  inferred_requirements: {
    required_hardware: string;
    typical_timeline_weeks: number;
    component_count: number;
    closest_corpus_reference?: string;
  };
  scoped_down_alternative?: ScopedDownAlternative | null;
  status: string;
}

export interface EvolutionLadderLevel {
  level: number;
  level_name: string;
  title: string;
  description: string;
  added_capabilities: string[];
  added_tech_stack: string[];
  estimated_weeks: number;
  feasibility_score: number;
  novelty_score: number;
}

export interface EvolutionLadderResponse {
  category: string;
  category_name: string;
  original_idea: string;
  ladder: EvolutionLadderLevel[];
  status: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  status: "Not Started" | "In Progress" | "Completed";
  linked_week: number;
  is_stretch: boolean;
  created_at?: string;
}

export interface TaskBoardResponse {
  project_id: string;
  tasks: ProjectTask[];
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  not_started_tasks: number;
  completion_percentage: number;
  drift_status: string;
  status: string;
}

export interface DatasetItem {
  id: string;
  name: string;
  domain: string;
  source: string;
  url: string;
  license: string;
  size: string;
  columns_fields: string[];
  target_variables: string[];
  suitability_notes: string;
  similarity_score: number;
}

export interface DatasetFindResponse {
  matched_datasets: DatasetItem[];
  match_found: boolean;
  message: string;
  classified_domain: string;
  status: string;
}

