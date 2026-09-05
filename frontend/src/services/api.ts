import {
  TaxonomyCategory,
  StudentProfile,
  ProjectIdea,
  GroundedProposal,
  NoveltyResult,
  AstVivaResponse,
  GitHubDriftAnalysis,
  CohortStudent,
  DuplicateCluster,
  DifficultyDistribution,
  OriginalityTransformResponse,
  FreeTextFeasibilityResponse,
  EvolutionLadderResponse,
  ProjectTask,
  TaskBoardResponse,
  DatasetFindResponse
} from '../types';


export const getApiBase = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL) as string | undefined;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    window.location.port !== '8000'
  ) {
    return 'http://127.0.0.1:8000';
  }
  return '';
};

const API_BASE = getApiBase();

export interface UserAccount {
  id: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  name: string;
  department: string;
  cohort_id: string;
}

export interface AuthResponse {
  status: string;
  access_token: string;
  token_type: string;
  user: UserAccount;
}

export class ApiService {
  private static getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('capstoneforge_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
          ...(options?.headers || {})
        },
        ...options
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${errBody || res.statusText}`);
      }

      return (await res.json()) as T;
    } catch (err: any) {
      console.warn(`[ApiService] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // -------------------------------------------------------------
  // 1. Authentication & RBAC
  // -------------------------------------------------------------
  static async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('capstoneforge_token', res.access_token);
    localStorage.setItem('capstoneforge_user', JSON.stringify(res.user));
    return res;
  }

  static async register(payload: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
    cohort_id?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    localStorage.setItem('capstoneforge_token', res.access_token);
    localStorage.setItem('capstoneforge_user', JSON.stringify(res.user));
    return res;
  }

  static async loginWithGoogle(email: string, name: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, name })
    });
    localStorage.setItem('capstoneforge_token', res.access_token);
    localStorage.setItem('capstoneforge_user', JSON.stringify(res.user));
    return res;
  }

  static async getCurrentUser(): Promise<UserAccount | null> {
    try {
      const res = await this.request<{ status: string; user: UserAccount }>('/api/auth/me');
      localStorage.setItem('capstoneforge_user', JSON.stringify(res.user));
      return res.user;
    } catch {
      return null;
    }
  }

  static logout() {
    localStorage.removeItem('capstoneforge_token');
    localStorage.removeItem('capstoneforge_user');
  }

  static getStoredUser(): UserAccount | null {
    try {
      const raw = localStorage.getItem('capstoneforge_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------
  // 2. Skill Taxonomy
  // -------------------------------------------------------------
  static async getTaxonomy(): Promise<{ version: string; categories: TaxonomyCategory[] }> {
    return this.request<{ version: string; categories: TaxonomyCategory[] }>('/api/taxonomy');
  }

  // -------------------------------------------------------------
  // 3. Student Profile & Deletion
  // -------------------------------------------------------------
  static async saveProfile(profile: StudentProfile): Promise<{ status: string; profile: StudentProfile }> {
    return this.request<{ status: string; profile: StudentProfile }>('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profile)
    });
  }

  static async getProfile(studentId: string): Promise<StudentProfile> {
    return this.request<StudentProfile>(`/api/profile/${studentId}`);
  }

  static async deleteStudentProfile(studentId: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(`/api/profile/${studentId}`, {
      method: 'DELETE'
    });
  }

  // -------------------------------------------------------------
  // 4. Idea Matching Engine
  // -------------------------------------------------------------
  static async matchIdeas(
    studentId?: string,
    profile?: StudentProfile,
    relevanceWeight = 0.55,
    feasibilityWeight = 0.45
  ): Promise<ProjectIdea[]> {
    if (profile) {
      const res = await this.request<{ status: string; ideas: ProjectIdea[] }>('/api/match', {
        method: 'POST',
        body: JSON.stringify({
          profile,
          relevance_weight: relevanceWeight,
          feasibility_weight: feasibilityWeight,
          limit: 30
        })
      });
      return res.ideas;
    } else {
      const sid = studentId || 'std-priya-01';
      const res = await this.request<{ status: string; ideas: ProjectIdea[] }>(
        `/match?student_id=${sid}&relevance_weight=${relevanceWeight}&feasibility_weight=${feasibilityWeight}&limit=30`
      );
      return res.ideas;
    }
  }

  // -------------------------------------------------------------
  // 5. Novelty Checker
  // -------------------------------------------------------------
  static async checkNovelty(title: string, description: string, threshold = 0.72): Promise<NoveltyResult> {
    const res = await this.request<{ status: string; result: NoveltyResult }>('/novelty-check', {
      method: 'POST',
      body: JSON.stringify({ title, description, top_k: 3, threshold })
    });
    return res.result;
  }

  // -------------------------------------------------------------
  // 6. RAG Grounded Proposal
  // -------------------------------------------------------------
  static async groundIdea(
    idea: ProjectIdea,
    profile: StudentProfile,
    apiKey = ''
  ): Promise<GroundedProposal> {
    const res = await this.request<{ status: string; proposal: GroundedProposal }>('/api/ideas/ground', {
      method: 'POST',
      body: JSON.stringify({ idea, profile, api_key: apiKey })
    });
    return res.proposal;
  }

  static async getProject(projectId: string): Promise<any> {
    return this.request<any>(`/api/project/${projectId}`);
  }

  // -------------------------------------------------------------
  // 7. AST Static Analysis for Viva Voce
  // -------------------------------------------------------------
  static async analyzeAstViva(sourceCode: string, filePath = 'main.py'): Promise<AstVivaResponse> {
    const res = await this.request<{ status: string; analysis: AstVivaResponse }>('/mentor/viva-questions', {
      method: 'POST',
      body: JSON.stringify({ source_code: sourceCode, file_path: filePath })
    });
    return res.analysis;
  }

  // -------------------------------------------------------------
  // 8. GitHub Progress Drift
  // -------------------------------------------------------------
  static async getGitHubDrift(
    repo = 'sample-student/capstone-repo',
    token = '',
    totalWeeks = 16,
    currentWeek = 7,
    projectId = ''
  ): Promise<GitHubDriftAnalysis> {
    const projParam = projectId ? `&project_id=${encodeURIComponent(projectId)}` : '';
    const res = await this.request<{ status: string; drift_analysis: GitHubDriftAnalysis }>(
      `/api/github/drift?repo=${encodeURIComponent(repo)}&token=${encodeURIComponent(token)}&total_weeks=${totalWeeks}&current_week=${currentWeek}${projParam}`
    );
    return res.drift_analysis;
  }

  // -------------------------------------------------------------
  // 9. Faculty / Cohort Oversight
  // -------------------------------------------------------------
  static async getCohortStudents(cohortId = 'cohort-cse-2026-a'): Promise<CohortStudent[]> {
    const res = await this.request<{ status: string; students: CohortStudent[] }>(
      `/cohort/students?cohort_id=${cohortId}`
    );
    return res.students;
  }

  static async getCohortDuplicates(cohortId = 'cohort-cse-2026-a', threshold = 0.72): Promise<DuplicateCluster[]> {
    const res = await this.request<{ status: string; duplicate_clusters: DuplicateCluster[] }>(
      `/cohort/duplicates?cohort_id=${cohortId}&similarity_threshold=${threshold}`
    );
    return res.duplicate_clusters;
  }

  static async getCohortDifficultyDistribution(cohortId = 'cohort-cse-2026-a'): Promise<DifficultyDistribution> {
    return this.request<DifficultyDistribution>(`/cohort/difficulty-distribution?cohort_id=${cohortId}`);
  }

  static async uploadArchive(
    title: string,
    abstract: string,
    domain = 'General',
    year = 2025
  ): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/api/admin/archive/upload', {
      method: 'POST',
      body: JSON.stringify({ title, abstract, domain, year })
    });
  }

  // -------------------------------------------------------------
  // 10. Admin User Management
  // -------------------------------------------------------------
  static async getAdminUsers(): Promise<UserAccount[]> {
    const res = await this.request<{ status: string; users: UserAccount[] }>('/api/admin/users');
    return res.users;
  }

  static async updateUserRole(userId: string, role: string): Promise<boolean> {
    const res = await this.request<{ status: string; message: string }>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    return res.status === 'success';
  }

  // -------------------------------------------------------------
  // 11. Advanced Features (Originality, Feasibility, Evolution, Tasks, Datasets)
  // -------------------------------------------------------------
  static async transformOriginality(
    ideaText: string,
    domain = '',
    threshold = 60.0
  ): Promise<OriginalityTransformResponse> {
    return this.request<OriginalityTransformResponse>('/api/originality/transform', {
      method: 'POST',
      body: JSON.stringify({ idea_text: ideaText, domain, threshold })
    });
  }

  static async checkFreeTextFeasibility(payload: {
    idea_text: string;
    team_size?: number;
    timeframe_weeks?: number;
    hardware_constraint?: string;
    student_skills?: Record<string, number>;
  }): Promise<FreeTextFeasibilityResponse> {
    return this.request<FreeTextFeasibilityResponse>('/api/feasibility/check-freetext', {
      method: 'POST',
      body: JSON.stringify({
        idea_text: payload.idea_text,
        team_size: payload.team_size || 1,
        timeframe_weeks: payload.timeframe_weeks || 16,
        hardware_constraint: payload.hardware_constraint || 'CPU-only',
        student_skills: payload.student_skills || {}
      })
    });
  }

  static async getEvolutionLadder(
    ideaText: string,
    domain = ''
  ): Promise<EvolutionLadderResponse> {
    return this.request<EvolutionLadderResponse>('/api/evolution/ladder', {
      method: 'POST',
      body: JSON.stringify({ idea_text: ideaText, domain })
    });
  }

  static async getProjectTasks(projectId: string): Promise<TaskBoardResponse> {
    return this.request<TaskBoardResponse>(`/api/tasks/${projectId}`);
  }

  static async createProjectTask(
    projectId: string,
    payload: { title: string; status?: string; linked_week?: number; is_stretch?: boolean }
  ): Promise<ProjectTask> {
    return this.request<ProjectTask>(`/api/tasks/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async updateTaskStatus(
    taskId: string,
    payload: { status?: string; title?: string; linked_week?: number; is_stretch?: boolean }
  ): Promise<{ status: string; task: ProjectTask }> {
    return this.request<{ status: string; task: ProjectTask }>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  static async findDatasets(
    ideaText: string,
    domain = '',
    topK = 4
  ): Promise<DatasetFindResponse> {
    return this.request<DatasetFindResponse>('/api/datasets/find', {
      method: 'POST',
      body: JSON.stringify({ idea_text: ideaText, domain, top_k: topK })
    });
  }
}

