import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  Cpu, 
  Briefcase, 
  GitBranch, 
  ExternalLink, 
  CheckCircle2, 
  MessageSquare, 
  Calendar,
  Sparkles,
  ArrowLeft,
  FileText,
  TrendingUp,
  Database,
  CheckSquare
} from 'lucide-react';
import { ProjectIdea, StudentProfile, GroundedProposal, GitHubDriftAnalysis, EvolutionLadderLevel } from '../types';
import { ScoreBreakdownCard } from '../components/ScoreBreakdownCard';
import { RoadmapTimeline } from '../components/RoadmapTimeline';
import { OriginalityTransformerPanel } from '../components/OriginalityTransformerPanel';
import { EvolutionLadderPanel } from '../components/EvolutionLadderPanel';
import { TaskBoardKanban } from '../components/TaskBoardKanban';
import { DatasetFinderPanel } from '../components/DatasetFinderPanel';
import { ApiService } from '../services/api';

interface ProjectStudioPageProps {
  idea: ProjectIdea | null;
  profile: StudentProfile | null;
  navigate: (route: string) => void;
}

export const ProjectStudioPage: React.FC<ProjectStudioPageProps> = ({
  idea,
  profile,
  navigate
}) => {
  const [proposal, setProposal] = useState<GroundedProposal | null>(null);
  const [driftData, setDriftData] = useState<GitHubDriftAnalysis | null>(null);
  const [isGrounding, setIsGrounding] = useState(false);
  const [isSyncingDrift, setIsSyncingDrift] = useState(false);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'ladder' | 'tasks' | 'datasets'>('blueprint');

  const projectId = idea && profile ? `proj-${profile.id || 'std-active'}-${idea.id}` : 'proj-default';

  useEffect(() => {
    if (idea && profile) {
      setIsGrounding(true);
      ApiService.groundIdea(idea, profile)
        .then((p) => setProposal(p))
        .catch((err) => console.error('Grounding error:', err))
        .finally(() => setIsGrounding(false));

      setIsSyncingDrift(true);
      ApiService.getGitHubDrift('sample-student/capstone-repo', '', 16, 7, projectId)
        .then((d) => setDriftData(d))
        .catch((err) => console.error('Drift fetch error:', err))
        .finally(() => setIsSyncingDrift(false));
    }
  }, [idea, profile, projectId]);

  const handleRefreshDrift = (repo: string) => {
    setIsSyncingDrift(true);
    ApiService.getGitHubDrift(repo, '', 16, 7, projectId)
      .then((d) => setDriftData(d))
      .catch((err) => console.error('Drift sync error:', err))
      .finally(() => setIsSyncingDrift(false));
  };

  const handleAdoptUpgradedVersion = (newTitle: string, newDesc: string, newNovelty: number) => {
    if (idea) {
      idea.title = newTitle;
      idea.description = newDesc;
      idea.novelty.novelty_score = newNovelty;
    }
    if (proposal) {
      setProposal({
        ...proposal,
        grounded_problem_statement: newDesc
      });
    }
  };

  const handleAdoptEvolutionLevel = (level: EvolutionLadderLevel) => {
    if (idea) {
      idea.title = `${idea.title.split(':')[0]}: Level ${level.level} (${level.title})`;
      // Add new tech stack additions
      const combinedTech = Array.from(new Set([...idea.tech_stack, ...level.added_tech_stack]));
      idea.tech_stack = combinedTech;
      idea.novelty.novelty_score = level.novelty_score;
      idea.feasibility.feasibility_score = level.feasibility_score;
    }
    if (proposal) {
      setProposal({
        ...proposal,
        stretch_features: Array.from(new Set([...proposal.stretch_features, ...level.added_capabilities]))
      });
    }
  };

  if (!idea) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-serif-heading font-bold text-2xl text-[#1c1917]">No Project Adopted Yet</h2>
        <p className="text-sm text-[#57534e]">
          Visit the Discovery Graph to select and adopt a verified engineering capstone proposal.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-[#1d6e5c] text-white rounded-lg text-xs font-semibold hover:bg-[#165648] transition-colors"
        >
          Open Discovery Graph
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back and Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e2d8] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-mono text-[#78716c] hover:text-[#1d6e5c] flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Graph
            </button>
            <span className="text-xs text-[#d6cfc4]">•</span>
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#1d6e5c]/10 text-[#1d6e5c] font-bold">
              {idea.domain}
            </span>
          </div>
          <h1 className="font-serif-heading font-bold text-3xl sm:text-4xl text-[#1c1917]">
            {idea.title}
          </h1>
          <p className="text-xs text-[#57534e]">
            Student Lead: <strong>{profile?.name || 'Candidate Engineer'}</strong> ({profile?.branch || 'CSE'}) • 
            Team Size: <strong>{profile?.team_size || 2}</strong> • 
            Timeline: <strong>{profile?.timeframe_weeks || 16} Weeks</strong>
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/mentor')}
            className="px-4 py-2 bg-[#1d6e5c] text-white rounded-lg text-xs font-semibold hover:bg-[#165648] transition-all shadow-sm flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            Launch Mentor & AST Viva
          </button>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e7e2d8] pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('blueprint')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'blueprint'
              ? 'bg-white text-[#1d6e5c] shadow-sm border border-[#d6cfc4]'
              : 'text-[#57534e] hover:text-[#1c1917]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Blueprint & Architecture
        </button>

        <button
          onClick={() => setActiveTab('ladder')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'ladder'
              ? 'bg-white text-[#1d6e5c] shadow-sm border border-[#d6cfc4]'
              : 'text-[#57534e] hover:text-[#1c1917]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Evolution Ladder (5 Levels)
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'tasks'
              ? 'bg-white text-[#1d6e5c] shadow-sm border border-[#d6cfc4]'
              : 'text-[#57534e] hover:text-[#1c1917]'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Tasks Kanban & Velocity
        </button>

        <button
          onClick={() => setActiveTab('datasets')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'datasets'
              ? 'bg-white text-[#1d6e5c] shadow-sm border border-[#d6cfc4]'
              : 'text-[#57534e] hover:text-[#1c1917]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Research Dataset Finder
        </button>
      </div>

      {/* Tab 1: Blueprint & Architecture */}
      {activeTab === 'blueprint' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Feature 1: Originality Transformer Panel if novelty score < 65 */}
          {idea.novelty.novelty_score < 65 && (
            <OriginalityTransformerPanel
              ideaTitle={idea.title}
              ideaDescription={idea.description}
              currentNoveltyScore={idea.novelty.novelty_score}
              domain={idea.domain}
              onAdoptUpgraded={handleAdoptUpgradedVersion}
            />
          )}

          {/* RAG Grounded Problem Statement & Attributed Citations */}
          <div className="academic-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
              <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1d6e5c]" />
                Grounded Problem Statement & Academic Background
              </h3>
              <span className="text-[10px] font-mono text-[#78716c] bg-[#faf7f2] border border-[#d6cfc4] px-2 py-0.5 rounded">
                {proposal?.generation_mode || 'RAG Grounded Synthesis'}
              </span>
            </div>

            {isGrounding ? (
              <div className="p-8 text-center space-y-2 font-mono text-xs text-[#78716c] animate-pulse">
                <Sparkles className="w-5 h-5 text-[#1d6e5c] mx-auto animate-spin" />
                <p>Retrieving recent peer-reviewed sources and grounding problem statement...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-sans leading-relaxed text-[#1c1917]">
                <p className="text-sm text-[#1c1917] leading-relaxed">
                  {proposal?.grounded_problem_statement || idea.description}
                </p>

                {/* Clickable Grounded Citations Chips */}
                {proposal?.citations && proposal.citations.length > 0 && (
                  <div className="pt-3 border-t border-[#f5f1e8] space-y-2">
                    <span className="text-[10px] font-mono uppercase text-[#78716c] font-bold block">
                      Grounding Research Publications & Repositories (Last 18 Months):
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {proposal.citations.map((c, idx) => (
                        <a
                          key={idx}
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#faf7f2] border border-[#d6cfc4] hover:border-[#1d6e5c] p-2.5 rounded-lg transition-all group block space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold text-[#1d6e5c]">
                            <span className="line-clamp-1">{c.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 ml-1 opacity-70 group-hover:opacity-100" />
                          </div>
                          <p className="text-[10px] text-[#57534e] line-clamp-2">{c.summary}</p>
                          <div className="flex justify-between text-[9px] font-mono text-[#78716c] pt-1 border-t border-[#e7e2d8]">
                            <span>{c.authors}</span>
                            <span className="font-bold">{c.year}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MVP vs Stretch Backlog & Tech Stack */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Features Backlog */}
            <div className="academic-card p-6 space-y-4">
              <h3 className="font-serif-heading font-bold text-base text-[#1c1917] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1d6e5c]" />
                Deliverable Backlog: MVP vs Stretch Goals
              </h3>

              <div className="space-y-4 text-xs font-sans">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#1d6e5c] font-bold block mb-1.5">
                    Core MVP Requirements (Mandatory for Viva Defense):
                  </span>
                  <ul className="space-y-2">
                    {(proposal?.mvp_features || idea.mvp_features).map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 bg-[#faf7f2] p-2 rounded border border-[#e7e2d8]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1d6e5c] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#c2703d] font-bold block mb-1.5">
                    Stretch Goals (Distinction & Research Publication Track):
                  </span>
                  <ul className="space-y-2">
                    {(proposal?.stretch_features || idea.stretch_features).map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 bg-[#faf7f2] p-2 rounded border border-[#e7e2d8]">
                        <Sparkles className="w-3.5 h-3.5 text-[#c2703d] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Tech Stack & Architecture Rationale */}
            <div className="academic-card p-6 space-y-4">
              <h3 className="font-serif-heading font-bold text-base text-[#1c1917] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#1d6e5c]" />
                Curated Tech Stack & Architectural Rationale
              </h3>

              <div className="space-y-3 text-xs font-sans">
                <div className="flex flex-wrap gap-2">
                  {idea.tech_stack.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-[#1d6e5c]/10 border border-[#1d6e5c]/30 text-[#1d6e5c] font-mono font-bold rounded-md"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#f5f1e8] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#78716c] font-bold block">
                    Architectural Rationale:
                  </span>
                  {(proposal?.tech_stack_rationale || [
                    "Layered separation of concerns between data ingestion and real-time inference.",
                    "Deterministic resource quantization targeting local CPU bounds without GPU reliance.",
                    "Production-grade ASGI microservice with OpenAPI schemas for reproducible evaluation."
                  ]).map((rat, i) => (
                    <div key={i} className="text-[#57534e] text-xs bg-[#faf7f2] p-2 rounded border border-[#e7e2d8]">
                      • {rat}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Deterministic Scores Grid */}
          <div className="space-y-3">
            <h3 className="font-serif-heading font-bold text-lg text-[#1c1917]">
              Verified Evaluation Scores & Mathematical Breakdowns
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ScoreBreakdownCard
                type="match"
                score={idea.relevance_score}
                data={idea.skill_coverage}
              />
              <ScoreBreakdownCard
                type="feasibility"
                score={idea.feasibility.feasibility_score}
                data={idea.feasibility}
              />
              <ScoreBreakdownCard
                type="novelty"
                score={idea.novelty.novelty_score}
                data={idea.novelty}
              />
              <ScoreBreakdownCard
                type="hireability"
                score={idea.hireability.hireability_score}
                data={idea.hireability}
              />
            </div>
          </div>

          {/* GitHub-Integrated Progress Tracking & Live Drift */}
          <div className="space-y-3 pt-4 border-t border-[#e7e2d8]">
            <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center justify-between">
              <span>GitHub-Integrated Progress Tracking & Drift Indicator</span>
              <span className="text-xs font-mono text-[#78716c]">Automated Milestone Drift vs Plan</span>
            </h3>
            <RoadmapTimeline
              driftData={driftData}
              isLoading={isSyncingDrift}
              onRefresh={handleRefreshDrift}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Feature 3 - Complexity Evolution Ladder */}
      {activeTab === 'ladder' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <EvolutionLadderPanel
            ideaTitle={idea.title}
            ideaDescription={idea.description}
            domain={idea.domain}
            onAdoptLevel={handleAdoptEvolutionLevel}
          />
        </div>
      )}

      {/* Tab 3: Feature 4 - Task Board Kanban */}
      {activeTab === 'tasks' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <TaskBoardKanban
            projectId={projectId}
            onStatsUpdated={(pct, drift) => {
              handleRefreshDrift('sample-student/capstone-repo');
            }}
          />
        </div>
      )}

      {/* Tab 4: Feature 6 - Research Dataset Finder */}
      {activeTab === 'datasets' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <DatasetFinderPanel
            ideaTitle={idea.title}
            ideaDescription={idea.description}
            domain={idea.domain}
          />
        </div>
      )}

    </div>
  );
};
