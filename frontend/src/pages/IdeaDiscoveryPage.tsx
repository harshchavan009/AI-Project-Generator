import React, { useState } from 'react';
import { 
  Sparkles, 
  Filter, 
  Search, 
  Layers, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  Sliders,
  ChevronRight,
  X,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { ProjectIdea, StudentProfile } from '../types';
import { IdeaGraphCanvas } from '../components/IdeaGraphCanvas';
import { ScoreBreakdownCard } from '../components/ScoreBreakdownCard';
import { IdeaSanityCheckCard } from '../components/IdeaSanityCheckCard';
import { OriginalityTransformerPanel } from '../components/OriginalityTransformerPanel';
import { NextStepPrompt } from '../components/NextStepPrompt';
import { SevenParameterScorecard } from '../components/SevenParameterScorecard';
import { useViewMode } from '../context/ViewModeContext';

interface IdeaDiscoveryPageProps {
  ideas: ProjectIdea[];
  selectedIdea: ProjectIdea | null;
  onSelectIdea: (idea: ProjectIdea) => void;
  onAdoptProject: (idea: ProjectIdea) => void;
  navigate: (route: string) => void;
  activeProfile: StudentProfile | null;
}

export const IdeaDiscoveryPage: React.FC<IdeaDiscoveryPageProps> = ({
  ideas,
  selectedIdea,
  onSelectIdea,
  onAdoptProject,
  navigate,
  activeProfile
}) => {
  const { isSimple } = useViewMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [minScore, setMinScore] = useState(40);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // First-run dismissible banner state stored in localStorage
  const [showFirstRunBanner, setShowFirstRunBanner] = useState<boolean>(() => {
    return localStorage.getItem('capstoneforge_dismiss_graph_banner') !== 'true';
  });

  const handleDismissBanner = () => {
    localStorage.setItem('capstoneforge_dismiss_graph_banner', 'true');
    setShowFirstRunBanner(false);
  };

  // Filter ideas based on user controls
  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.tech_stack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDomain = domainFilter === 'ALL' || idea.domain === domainFilter;
    const matchesScore = idea.combined_score >= minScore;

    return matchesSearch && matchesDomain && matchesScore;
  });

  const domains = Array.from(new Set(ideas.map((i) => i.domain)));

  const handleNodeClick = (idea: ProjectIdea) => {
    onSelectIdea(idea);
    setIsDrawerOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* First-Run Plain-Language Instruction Banner */}
      {showFirstRunBanner && (
        <div className="bg-[#1d6e5c]/10 border border-[#1d6e5c]/30 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1d6e5c] text-white shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1c1917]">
                Click a topic bubble below to see matching project ideas. The number shows how well it fits your skills.
              </p>
              <p className="text-[11px] text-[#57534e] mt-0.5">
                Bubbles closer to 100% fit your declared skills best. Green circles represent original, non-duplicate ideas.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismissBanner}
            className="text-xs font-semibold text-[#1d6e5c] hover:text-[#165849] bg-white border border-[#d6cfc4] hover:border-[#1d6e5c] px-3 py-1.5 rounded-lg transition-colors shrink-0 shadow-xs"
          >
            Got it
          </button>
        </div>
      )}

      {/* Header with Title and Filtering Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e7e2d8] pb-5">
        <div>
          {isSimple ? (
            /* Simple Mode Header */
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#1d6e5c] font-semibold bg-[#1d6e5c]/10 px-2 py-0.5 rounded">
                  Personalized Recommendations
                </span>
                <details className="text-[11px] font-mono text-[#78716c] cursor-pointer group">
                  <summary className="hover:text-[#1d6e5c] list-none flex items-center gap-1 font-sans">
                    <span>ⓘ How this works</span>
                  </summary>
                  <div className="absolute z-20 mt-1.5 p-3 bg-[#faf7f2] border border-[#d6cfc4] rounded-lg shadow-lg text-[11px] text-[#57534e] max-w-sm space-y-1">
                    <p className="font-semibold text-[#1c1917]">Deterministic Matching Engine</p>
                    <p>Powered by local FastEmbed ONNX INT8 embeddings and topological skill gap graphs. No black-box LLM guessing.</p>
                  </div>
                </details>
              </div>
              <h1 className="font-serif-heading font-bold text-3xl sm:text-4xl text-[#1c1917]">
                Find Your Project — pick a topic below to see ideas matched to you
              </h1>
              <p className="text-sm text-[#57534e] mt-1 max-w-2xl">
                Browse project ideas tailored to your team size, hardware constraints, and skills. Click any bubble to review what it takes to build.
              </p>
            </div>
          ) : (
            /* Technical Mode Header */
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[#78716c] uppercase mb-1">
                <span>Deterministic Matching Engine</span>
                <span>•</span>
                <span className="text-[#1d6e5c] font-bold">FastEmbed ONNX INT8 Local Vector Space</span>
              </div>
              <h1 className="font-serif-heading font-bold text-3xl sm:text-4xl text-[#1c1917]">
                Interactive Capstone Discovery
              </h1>
              <p className="text-sm text-[#57534e] mt-1 max-w-2xl">
                Explore 100+ curated engineering projects in a zoomable topological force-graph. 
                All match ratios, feasibility constraints, and novelty indices are computed deterministically on your local backend.
              </p>
            </div>
          )}
        </div>

        {/* Action button to modify profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-white border border-[#d6cfc4] hover:border-[#1d6e5c] rounded-lg text-xs font-semibold text-[#1c1917] transition-all shadow-sm flex items-center gap-2"
          >
            <Sliders className="w-3.5 h-3.5 text-[#1d6e5c]" />
            Adjust Skill Profile
          </button>
        </div>
      </div>

      {/* Feature 2: Free-Text Idea Feasibility Checker */}
      <IdeaSanityCheckCard
        activeProfile={activeProfile}
        onAdoptAlternative={(altTitle, altDomain) => {
          setSearchQuery(altTitle);
          if (domains.includes(altDomain)) {
            setDomainFilter(altDomain);
          }
        }}
      />

      {/* Filter Toolbar */}
      <div className="academic-card p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">

        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#78716c]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, technologies (e.g., PyTorch, ESP32, eBPF)..."
            className="w-full bg-transparent text-[#1c1917] placeholder-[#a8a29e] focus:outline-none font-sans text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          {/* Domain Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#78716c]">Domain:</span>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="bg-[#faf7f2] border border-[#d6cfc4] rounded px-2 py-1 text-xs text-[#1c1917] focus:outline-none"
            >
              <option value="ALL">All Domains ({ideas.length})</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Min Score Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[#78716c]">Min Match:</span>
            <input
              type="range"
              min={20}
              max={90}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="accent-[#1d6e5c] w-20 cursor-pointer"
            />
            <span className="font-bold text-[#1d6e5c] w-8">{minScore}%</span>
          </div>

          <span className="text-[11px] text-[#78716c] font-sans">
            Showing <strong>{filteredIdeas.length}</strong> proposals
          </span>
        </div>
      </div>

      {/* Main Visual Arena: D3 Graph Canvas */}
      <div className="relative">
        <IdeaGraphCanvas
          ideas={filteredIdeas}
          selectedIdea={selectedIdea}
          onSelectIdea={handleNodeClick}
        />

        {/* Selected Idea Floating Inspector Drawer */}
        {isDrawerOpen && selectedIdea && (
          <div className="absolute top-4 right-4 bottom-4 w-full sm:w-[480px] bg-white/95 backdrop-blur-md border border-[#d6cfc4] rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="bg-[#faf7f2] border-b border-[#e7e2d8] p-4 flex items-start justify-between">
              <div className="pr-4 space-y-1">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1d6e5c]/10 text-[#1d6e5c] font-bold">
                  {selectedIdea.domain}
                </span>
                <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] leading-snug">
                  {selectedIdea.title}
                </h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 hover:bg-[#ede8df] rounded text-[#78716c] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-xs text-[#57534e] leading-relaxed">
                {selectedIdea.description}
              </p>

              {/* Technologies Pill List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-[#78716c] block">Required Tech Stack:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedIdea.tech_stack.map((t, i) => (
                    <span key={i} className="text-[11px] font-mono bg-[#faf7f2] border border-[#d6cfc4] text-[#1c1917] px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Feature 1: Idea Originality Transformer */}
              {selectedIdea.novelty.novelty_score < 65 && (
                <OriginalityTransformerPanel
                  ideaTitle={selectedIdea.title}
                  ideaDescription={selectedIdea.description}
                  currentNoveltyScore={selectedIdea.novelty.novelty_score}
                  domain={selectedIdea.domain}
                  onAdoptUpgraded={(newTitle, newDesc, newNovelty) => {
                    selectedIdea.title = newTitle;
                    selectedIdea.description = newDesc;
                    selectedIdea.novelty.novelty_score = newNovelty;
                    onSelectIdea({ ...selectedIdea });
                  }}
                />
              )}

              {/* Feature 5: 7-Parameter Scorecard & Why Recommended Box */}
              <SevenParameterScorecard
                idea={selectedIdea}
                profile={activeProfile}
              />

              {/* All 4 Deterministic Score Breakdown Cards */}
              <div className="space-y-3 pt-2">

                <ScoreBreakdownCard
                  type="match"
                  score={selectedIdea.relevance_score}
                  data={selectedIdea.skill_coverage}
                />
                <ScoreBreakdownCard
                  type="feasibility"
                  score={selectedIdea.feasibility.feasibility_score}
                  data={selectedIdea.feasibility}
                />
                <ScoreBreakdownCard
                  type="novelty"
                  score={selectedIdea.novelty.novelty_score}
                  data={selectedIdea.novelty}
                />
                <ScoreBreakdownCard
                  type="hireability"
                  score={selectedIdea.hireability.hireability_score}
                  data={selectedIdea.hireability}
                />
              </div>
            </div>

            {/* Drawer Footer Action */}
            <div className="bg-[#faf7f2] border-t border-[#e7e2d8] p-3.5 flex items-center justify-between">
              <div className="font-mono text-xs">
                <span className="text-[#78716c]">Combined Rank: </span>
                <span className="font-bold text-[#1d6e5c] text-sm">{selectedIdea.combined_score}%</span>
              </div>
              <button
                onClick={() => onAdoptProject(selectedIdea)}
                className="px-4 py-2 bg-[#1d6e5c] text-white rounded-lg text-xs font-semibold hover:bg-[#165648] transition-colors shadow-sm flex items-center gap-1.5"
              >
                Adopt & Open Studio
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guided Next Step Prompt */}
      <NextStepPrompt
        stepText={
          selectedIdea
            ? `Click "Adopt & Open Studio" in the drawer to open the blueprint and roadmap for "${selectedIdea.title.split(':')[0]}".`
            : "Click a project bubble on the graph to inspect its skill match, feasibility, and required stack."
        }
        actionLabel={selectedIdea ? "Adopt Project" : undefined}
        onAction={selectedIdea ? () => onAdoptProject(selectedIdea) : undefined}
      />

    </div>
  );
};
