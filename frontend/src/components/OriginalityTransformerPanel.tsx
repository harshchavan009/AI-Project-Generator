import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Check, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Cpu,
  RefreshCw
} from 'lucide-react';
import { ApiService } from '../services/api';
import { OriginalityTransformResponse, EnhancementPattern } from '../types';

interface OriginalityTransformerPanelProps {
  ideaTitle: string;
  ideaDescription: string;
  currentNoveltyScore: number;
  domain?: string;
  onAdoptUpgraded: (newTitle: string, newDescription: string, newNoveltyScore: number) => void;
}

export const OriginalityTransformerPanel: React.FC<OriginalityTransformerPanelProps> = ({
  ideaTitle,
  ideaDescription,
  currentNoveltyScore,
  domain = '',
  onAdoptUpgraded
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [transformResult, setTransformResult] = useState<OriginalityTransformResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAdopted, setHasAdopted] = useState(false);

  const handleTransform = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiService.transformOriginality(
        `${ideaTitle}. ${ideaDescription}`,
        domain,
        65.0
      );
      setTransformResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to transform idea originality');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdopt = () => {
    if (!transformResult) return;
    onAdoptUpgraded(
      transformResult.upgraded_title,
      transformResult.upgraded_description,
      transformResult.projected_novelty_score
    );
    setHasAdopted(true);
  };

  return (
    <div className="academic-card p-5 border-2 border-[#1d6e5c]/30 bg-gradient-to-br from-[#faf7f2] to-[#f5f1e8] space-y-4 rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#78716c] uppercase mb-1">
            <span className="text-[#1d6e5c] font-bold">Feature 1</span>
            <span>•</span>
            <span>Curated Differentiation Pattern Injection</span>
          </div>
          <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1d6e5c]" />
            Strengthen This Idea (Originality Transformer)
          </h3>
          <p className="text-xs text-[#57534e]">
            This proposal has a novelty score of <strong>{currentNoveltyScore}%</strong>. 
            Inject verified architectural differentiation patterns (e.g. differential privacy, eBPF telemetry, edge quantization) 
            to upgrade novelty to verified benchmark thresholds.
          </p>
        </div>

        {!transformResult && (
          <button
            onClick={handleTransform}
            disabled={isLoading}
            className="px-4 py-2 bg-[#1d6e5c] text-white rounded-lg text-xs font-semibold hover:bg-[#165648] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade Novelty
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Before / After Novelty Score Comparison */}
      {transformResult && (
        <div className="space-y-4 pt-2 border-t border-[#e7e2d8] animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-[#d6cfc4]">
            {/* Before Score */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#78716c] block">Original Novelty Score:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#c2703d]">
                  {transformResult.original_novelty_score}%
                </span>
                <span className="text-[11px] text-[#78716c]">High overlap risk</span>
              </div>
              <div className="w-full bg-[#ede8df] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#c2703d] h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, transformResult.original_novelty_score)}%` }} 
                />
              </div>
            </div>

            {/* After Score */}
            <div className="space-y-1 sm:border-l sm:border-[#e7e2d8] sm:pl-3">
              <span className="text-[10px] font-mono uppercase text-[#1d6e5c] font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Projected Novelty Score (+{transformResult.improvement_delta}%):
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#1d6e5c]">
                  {transformResult.projected_novelty_score}%
                </span>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                  Differentiated
                </span>
              </div>
              <div className="w-full bg-[#ede8df] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1d6e5c] h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, transformResult.projected_novelty_score)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Applied Enhancement Patterns */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase text-[#78716c] font-bold block">
              Auditable Differentiation Patterns Applied (from Domain Taxonomy):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {transformResult.enhancement_patterns_applied.map((pat: EnhancementPattern, idx: number) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-[#e7e2d8] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c1917]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1d6e5c] shrink-0" />
                    <span className="line-clamp-1">{pat.name}</span>
                  </div>
                  <p className="text-[11px] text-[#57534e] line-clamp-2">{pat.description}</p>
                  {pat.added_tech && pat.added_tech.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {pat.added_tech.slice(0, 2).map((t, i) => (
                        <span key={i} className="text-[9px] font-mono bg-[#faf7f2] border border-[#d6cfc4] px-1.5 py-0.5 rounded text-[#1c1917]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upgraded Title & Description */}
          <div className="bg-white p-4 rounded-lg border border-[#d6cfc4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#1d6e5c] font-bold">
                Upgraded Architectural Specification:
              </span>
              <span className="text-[10px] font-mono text-[#78716c]">Measured via local ONNX FastEmbed</span>
            </div>
            <h4 className="font-serif-heading font-bold text-base text-[#1c1917]">
              {transformResult.upgraded_title}
            </h4>
            <p className="text-xs text-[#57534e] leading-relaxed">
              {transformResult.upgraded_description}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleTransform}
              disabled={isLoading}
              className="text-xs font-mono text-[#78716c] hover:text-[#1c1917] flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Try alternate pattern blend
            </button>

            <button
              onClick={handleAdopt}
              disabled={hasAdopted}
              className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all ${
                hasAdopted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-[#1d6e5c] text-white hover:bg-[#165648]'
              }`}
            >
              {hasAdopted ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Upgraded Version Adopted!
                </>
              ) : (
                <>
                  Adopt Upgraded Version
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
