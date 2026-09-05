import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  Search, 
  Cpu, 
  Clock, 
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ApiService } from '../services/api';
import { FreeTextFeasibilityResponse, StudentProfile } from '../types';

interface IdeaSanityCheckCardProps {
  activeProfile: StudentProfile | null;
  onAdoptAlternative?: (title: string, domain: string, description: string) => void;
}

export const IdeaSanityCheckCard: React.FC<IdeaSanityCheckCardProps> = ({
  activeProfile,
  onAdoptAlternative
}) => {
  const [ideaText, setIdeaText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FreeTextFeasibilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCheck = async () => {
    if (!ideaText.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await ApiService.checkFreeTextFeasibility({
        idea_text: ideaText.trim(),
        team_size: activeProfile?.team_size || 1,
        timeframe_weeks: activeProfile?.timeframe_weeks || 16,
        hardware_constraint: activeProfile?.hardware_constraint || 'CPU-only',
        student_skills: activeProfile?.skills || {}
      });
      setResult(res);
      setIsExpanded(true);
    } catch (err: any) {
      setError(err.message || 'Failed to verify feasibility');
    } finally {
      setIsLoading(false);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            FEASIBILITY: HIGH ({result?.feasibility_score ?? 85}%)
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            FEASIBILITY: MODERATE ({result?.feasibility_score ?? 60}%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            FEASIBILITY: LOW RISK ({result?.feasibility_score ?? 35}%)
          </span>
        );
    }
  };

  return (
    <div className="academic-card p-5 border border-[#d6cfc4] bg-white space-y-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#78716c] uppercase mb-1">
            <span className="text-[#1d6e5c] font-bold">Feature 2</span>
            <span>•</span>
            <span>Deterministic Structural Taxonomy Check</span>
          </div>
          <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1d6e5c]" />
            Free-Text Idea Sanity Check
          </h3>
          <p className="text-xs text-[#57534e]">
            Type your own custom project idea before browsing the catalog. Backend rules check data availability, 
            research complexity (PhD scope vs undergraduate), and team constraints before any LLM phrasing.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-2">
        <textarea
          rows={2}
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          placeholder="e.g., Predicting earthquake magnitude 30 days in advance using seismic sensors and satellite telemetry..."
          className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded-lg p-3 text-xs text-[#1c1917] placeholder-[#a8a29e] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c] font-sans"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#78716c]">
            <span>Constraints:</span>
            <span className="bg-[#f0ebe1] px-2 py-0.5 rounded text-[#1c1917]">
              {activeProfile?.team_size || 1} Person
            </span>
            <span className="bg-[#f0ebe1] px-2 py-0.5 rounded text-[#1c1917]">
              {activeProfile?.timeframe_weeks || 16} Wks
            </span>
            <span className="bg-[#f0ebe1] px-2 py-0.5 rounded text-[#1c1917]">
              {activeProfile?.hardware_constraint || 'CPU-only'}
            </span>
          </div>

          <button
            onClick={handleCheck}
            disabled={isLoading || !ideaText.trim()}
            className="px-4 py-2 bg-[#1d6e5c] text-white rounded-lg text-xs font-semibold hover:bg-[#165648] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⟳</span>
                Evaluating Rules...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                Run Sanity Check
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="mt-4 pt-4 border-t border-[#e7e2d8] space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getVerdictBadge(result.feasibility_verdict)}
              <span className="text-xs font-mono text-[#78716c]">
                Inferred: <strong>{result.inferred_requirements.required_hardware}</strong> • {result.inferred_requirements.typical_timeline_weeks} wks
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-mono text-[#78716c] hover:text-[#1c1917] flex items-center gap-1"
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isExpanded && (
            <div className="space-y-3 text-xs">
              {/* Inferred Requirements */}
              <div className="grid grid-cols-3 gap-2 bg-[#faf7f2] p-3 rounded-lg border border-[#e7e2d8]">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#1d6e5c]" />
                  <span>Hardware: <strong>{result.inferred_requirements.required_hardware}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1d6e5c]" />
                  <span>Scope: <strong>{result.inferred_requirements.typical_timeline_weeks} Weeks</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#1d6e5c]" />
                  <span>Modules: <strong>{result.inferred_requirements.component_count} Components</strong></span>
                </div>
              </div>

              {/* Failing Factors / Structural Flags */}
              {result.failing_factors && result.failing_factors.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5">
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-900 block">
                    Structural Constraints & Risk Factors:
                  </span>
                  <ul className="space-y-1 text-[#1c1917]">
                    {result.failing_factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs">
                        <span className="text-amber-700 font-bold">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scoped-down Alternative if Low */}
              {result.scoped_down_alternative && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Scoped-Down Undergraduate Alternative
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      {result.scoped_down_alternative.domain}
                    </span>
                  </div>
                  <h4 className="font-serif-heading font-bold text-sm text-[#1c1917]">
                    {result.scoped_down_alternative.title}
                  </h4>
                  <p className="text-xs text-[#57534e]">
                    {result.scoped_down_alternative.description}
                  </p>
                  <p className="text-[11px] text-[#1c1917] italic bg-white/70 p-2 rounded border border-emerald-100">
                    <strong>Academic Scope Rationale:</strong> {result.scoped_down_alternative.rationale}
                  </p>
                  {result.scoped_down_alternative.suggested_tech && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {result.scoped_down_alternative.suggested_tech.map((t, i) => (
                        <span key={i} className="text-[10px] font-mono bg-emerald-100/60 text-emerald-800 px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {onAdoptAlternative && (
                    <button
                      onClick={() => onAdoptAlternative(
                        result.scoped_down_alternative!.title,
                        result.scoped_down_alternative!.domain,
                        result.scoped_down_alternative!.description
                      )}
                      className="mt-2 px-3 py-1.5 bg-[#1d6e5c] text-white rounded text-xs font-semibold hover:bg-[#165648] transition-colors flex items-center gap-1"
                    >
                      Use Scoped-Down Alternative as Basis
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
