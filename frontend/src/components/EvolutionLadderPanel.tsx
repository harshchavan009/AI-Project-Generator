import React, { useState, useEffect } from 'react';
import { 
  GitCommit, 
  Layers, 
  Cpu, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  ChevronRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { ApiService } from '../services/api';
import { EvolutionLadderResponse, EvolutionLadderLevel } from '../types';

interface EvolutionLadderPanelProps {
  ideaTitle: string;
  ideaDescription: string;
  domain?: string;
  onAdoptLevel: (level: EvolutionLadderLevel) => void;
}

export const EvolutionLadderPanel: React.FC<EvolutionLadderPanelProps> = ({
  ideaTitle,
  ideaDescription,
  domain = '',
  onAdoptLevel
}) => {
  const [ladderData, setLadderData] = useState<EvolutionLadderResponse | null>(null);
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(2); // Default to Level 3 (Production)
  const [adoptedLevelIdx, setAdoptedLevelIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    ApiService.getEvolutionLadder(`${ideaTitle}. ${ideaDescription}`, domain)
      .then((data) => setLadderData(data))
      .catch((err) => setError(err.message || 'Failed to load complexity ladder'))
      .finally(() => setIsLoading(false));
  }, [ideaTitle, ideaDescription, domain]);

  if (isLoading) {
    return (
      <div className="academic-card p-6 text-center space-y-2 text-xs font-mono text-[#78716c] animate-pulse">
        <Sparkles className="w-5 h-5 text-[#1d6e5c] mx-auto animate-spin" />
        <p>Aligning project domain with 5-level complexity progression ladder...</p>
      </div>
    );
  }

  if (error || !ladderData || !ladderData.ladder || ladderData.ladder.length === 0) {
    return null;
  }

  const activeLevel = ladderData.ladder[selectedLevelIdx] || ladderData.ladder[0];

  const handleAdopt = () => {
    onAdoptLevel(activeLevel);
    setAdoptedLevelIdx(selectedLevelIdx);
  };

  const getLevelColor = (lvlNum: number) => {
    switch (lvlNum) {
      case 1: return 'text-slate-600 bg-slate-100 border-slate-300';
      case 2: return 'text-sky-700 bg-sky-100 border-sky-300';
      case 3: return 'text-[#1d6e5c] bg-emerald-100 border-emerald-300';
      case 4: return 'text-amber-700 bg-amber-100 border-amber-300';
      case 5: return 'text-purple-700 bg-purple-100 border-purple-300';
      default: return 'text-[#1d6e5c] bg-[#1d6e5c]/10 border-[#1d6e5c]/30';
    }
  };

  return (
    <div className="academic-card p-6 border border-[#d6cfc4] space-y-6 bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e2d8] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#78716c] uppercase mb-1">
            <span className="text-[#1d6e5c] font-bold">Feature 3</span>
            <span>•</span>
            <span>Curated Complexity Ladder Engine</span>
          </div>
          <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1d6e5c]" />
            Project Evolution Engine: {ladderData.category_name}
          </h3>
          <p className="text-xs text-[#57534e]">
            Select your targeted complexity scope. Each level adds verified enterprise capabilities and tech additions.
          </p>
        </div>

        {/* Adopt Button Header */}
        <button
          onClick={handleAdopt}
          className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all shrink-0 ${
            adoptedLevelIdx === selectedLevelIdx
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-[#1d6e5c] text-white hover:bg-[#165648]'
          }`}
        >
          {adoptedLevelIdx === selectedLevelIdx ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Level {activeLevel.level} Adopted!
            </>
          ) : (
            <>
              Adopt Level {activeLevel.level} Blueprint
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Horizontal Stepper (Levels 1 to 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ladderData.ladder.map((lvl, idx) => {
          const isSelected = selectedLevelIdx === idx;
          const isAdopted = adoptedLevelIdx === idx;

          return (
            <button
              key={lvl.level}
              onClick={() => setSelectedLevelIdx(idx)}
              className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between min-h-[90px] ${
                isSelected
                  ? 'border-[#1d6e5c] bg-[#1d6e5c]/5 ring-2 ring-[#1d6e5c]/30 shadow-sm'
                  : 'border-[#e7e2d8] bg-[#faf7f2] hover:bg-white hover:border-[#d6cfc4]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${getLevelColor(lvl.level)}`}>
                  L{lvl.level}
                </span>
                {isAdopted && (
                  <span className="text-[9px] font-mono bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#1c1917] line-clamp-1 block">
                  {lvl.title.split(':')[0]}
                </span>
                <span className="text-[10px] font-mono text-[#78716c] block">
                  {lvl.estimated_weeks} wks • Nov {lvl.novelty_score}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Level Delta Inspector */}
      <div className="bg-[#faf7f2] p-5 rounded-xl border border-[#d6cfc4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e2d8] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getLevelColor(activeLevel.level)}`}>
                Level {activeLevel.level}
              </span>
              <h4 className="font-serif-heading font-bold text-base text-[#1c1917]">
                {activeLevel.title}
              </h4>
            </div>
            <p className="text-xs text-[#57534e] mt-1">
              {activeLevel.description}
            </p>
          </div>

          {/* Metric Badges for this level */}
          <div className="flex items-center gap-3 font-mono text-xs shrink-0">
            <div className="bg-white px-2.5 py-1.5 rounded border border-[#d6cfc4] text-center">
              <span className="text-[10px] text-[#78716c] block">Feasibility</span>
              <span className="font-bold text-[#1d6e5c]">{activeLevel.feasibility_score}%</span>
            </div>
            <div className="bg-white px-2.5 py-1.5 rounded border border-[#d6cfc4] text-center">
              <span className="text-[10px] text-[#78716c] block">Novelty</span>
              <span className="font-bold text-[#c2703d]">{activeLevel.novelty_score}%</span>
            </div>
            <div className="bg-white px-2.5 py-1.5 rounded border border-[#d6cfc4] text-center">
              <span className="text-[10px] text-[#78716c] block">Timeline</span>
              <span className="font-bold text-[#1c1917]">{activeLevel.estimated_weeks} Wks</span>
            </div>
          </div>
        </div>

        {/* Delta Columns: Added Capabilities vs Tech Stack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Added Capabilities */}
          <div className="space-y-2 bg-white p-3.5 rounded-lg border border-[#e7e2d8]">
            <span className="font-mono text-[10px] uppercase font-bold text-[#1d6e5c] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Added Capabilities at Level {activeLevel.level}:
            </span>
            <ul className="space-y-1.5">
              {activeLevel.added_capabilities.map((cap, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[#1c1917]">
                  <Check className="w-3 h-3 text-[#1d6e5c] shrink-0 mt-0.5" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack Additions */}
          <div className="space-y-2 bg-white p-3.5 rounded-lg border border-[#e7e2d8]">
            <span className="font-mono text-[10px] uppercase font-bold text-[#78716c] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#1d6e5c]" />
              Architectural Tech Additions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeLevel.added_tech_stack.map((tech, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-[#faf7f2] border border-[#d6cfc4] text-[#1c1917] font-mono text-[11px] rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[#78716c] pt-2 italic">
              Estimated scope extension: <strong>+{Math.max(0, activeLevel.estimated_weeks - 16)} weeks</strong> over baseline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
