import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  BookOpen, 
  Cpu, 
  Briefcase, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { 
  FeasibilityResult, 
  NoveltyResult, 
  SkillCoverageBreakdown, 
  HireabilityResult 
} from '../types';
import { useViewMode } from '../context/ViewModeContext';

interface ScoreBreakdownCardProps {
  type: 'match' | 'feasibility' | 'novelty' | 'hireability';
  score: number;
  data: any;
  compact?: boolean;
}

export const ScoreBreakdownCard: React.FC<ScoreBreakdownCardProps> = ({
  type,
  score,
  data,
  compact = false
}) => {
  const { isSimple } = useViewMode();

  if (type === 'feasibility') {
    const feas = data as FeasibilityResult;

    const getFeasibilitySummary = () => {
      if (feas.feasibility_band === 'HIGH') {
        return 'Realistic for your team size and timeline.';
      }
      const penalty = feas.factor_breakdown?.find((f) => f.status === 'PENALTY');
      if (penalty) {
        return `Achievable with caution — watch ${penalty.factor.toLowerCase()}: ${penalty.explanation}`;
      }
      if (feas.feasibility_band === 'MODERATE') {
        return 'Manageable scope with steady milestone pace.';
      }
      return 'High risk — requires significant hardware or timeline adjustments.';
    };

    return (
      <div className="academic-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2">
          <div>
            <span className="text-[11px] font-mono uppercase text-[#78716c] font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#1d6e5c]" />
              Feasibility Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-serif-heading font-bold text-2xl text-[#1c1917]">{feas.feasibility_score}%</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                feas.feasibility_band === 'HIGH'
                  ? 'bg-emerald-100 text-emerald-800'
                  : feas.feasibility_band === 'MODERATE'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {feas.feasibility_band}
              </span>
            </div>
          </div>
          
          {!isSimple ? (
            <div className="text-right font-mono text-[11px] text-[#57534e]">
              <div>Rule Base: <strong>{feas.rule_score}%</strong></div>
              <div>ML Predict: <strong>{Math.round(feas.ml_completion_probability * 100)}%</strong></div>
            </div>
          ) : (
            <details className="text-right font-mono text-[10px] text-[#78716c] cursor-pointer">
              <summary className="hover:text-[#1d6e5c]">Technical details</summary>
              <div className="mt-1 bg-[#faf7f2] p-1.5 rounded border border-[#e7e2d8]">
                <div>Rule Base: {feas.rule_score}%</div>
                <div>ML Predict: {Math.round(feas.ml_completion_probability * 100)}%</div>
              </div>
            </details>
          )}
        </div>

        {/* Sitewide One-Line Plain Language Explanation */}
        <div className="text-xs font-sans text-[#44403c] bg-[#faf7f2] border border-[#e7e2d8] rounded-md px-2.5 py-1.5 font-medium leading-snug">
          <span className="text-[#1d6e5c] font-bold font-mono mr-1">{feas.feasibility_score}% Feasibility</span>
          — {getFeasibilitySummary()}
        </div>

        {/* Inline Factor Drivers Breakdown */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase text-[#78716c] block">
            Factor Impacts ({feas.rules_applied_count} rules evaluated):
          </span>
          {feas.factor_breakdown.map((f, idx) => (
            <div key={idx} className="flex items-start justify-between text-xs py-1 border-b border-[#f5f1e8] last:border-0">
              <div className="flex items-start gap-1.5 pr-2">
                {f.status === 'CREDIT' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : f.status === 'PENALTY' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-[#78716c] shrink-0 mt-0.5">•</span>
                )}
                <div>
                  <span className="font-medium text-[#1c1917]">{f.factor}</span>
                  {!compact && <p className="text-[11px] text-[#57534e] mt-0.5">{f.explanation}</p>}
                </div>
              </div>
              <span className={`font-mono font-bold shrink-0 ${
                f.impact > 0 ? 'text-emerald-700' : f.impact < 0 ? 'text-amber-700' : 'text-[#78716c]'
              }`}>
                {f.impact > 0 ? `+${f.impact}` : f.impact < 0 ? `${f.impact}` : '0'} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'novelty') {
    const nov = data as NoveltyResult;

    const getNoveltySummary = () => {
      if (nov.novelty_score >= 75 && !nov.is_high_overlap) {
        return 'Highly original — minimal overlap with previous student capstones.';
      }
      if (nov.novelty_score >= 50 && !nov.is_high_overlap) {
        return 'Somewhat common theme — adding a custom extension is recommended.';
      }
      return `Very similar to existing submissions (${nov.max_similarity_percentage}% match) — consider differentiation.`;
    };

    return (
      <div className="academic-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2">
          <div>
            <span className="text-[11px] font-mono uppercase text-[#78716c] font-semibold flex items-center gap-1.5">
              {nov.is_high_overlap ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-[#1d6e5c]" />
              )}
              Uniqueness / Novelty
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-serif-heading font-bold text-2xl text-[#1c1917]">{nov.novelty_score}/100</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                nov.is_high_overlap ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {nov.is_high_overlap ? 'HIGH OVERLAP' : 'DISTINCT'}
              </span>
            </div>
          </div>

          {!isSimple ? (
            <div className="text-right font-mono text-[11px] text-[#57534e]">
              <div>Max Sim: <strong>{nov.max_similarity_percentage}%</strong></div>
              <div>Corpus: <strong>{nov.corpus_size_evaluated} past works</strong></div>
            </div>
          ) : (
            <details className="text-right font-mono text-[10px] text-[#78716c] cursor-pointer">
              <summary className="hover:text-[#1d6e5c]">Vector details</summary>
              <div className="mt-1 bg-[#faf7f2] p-1.5 rounded border border-[#e7e2d8]">
                <div>Max Sim: {nov.max_similarity_percentage}%</div>
                <div>Corpus: {nov.corpus_size_evaluated} past works</div>
              </div>
            </details>
          )}
        </div>

        {/* Sitewide One-Line Plain Language Explanation */}
        <div className="text-xs font-sans text-[#44403c] bg-[#faf7f2] border border-[#e7e2d8] rounded-md px-2.5 py-1.5 font-medium leading-snug">
          <span className="text-[#1d6e5c] font-bold font-mono mr-1">{nov.novelty_score}% Novelty</span>
          — {getNoveltySummary()}
        </div>

        {nov.is_high_overlap && (
          <div className="bg-rose-50 border border-rose-200 rounded p-2 text-xs text-rose-900 font-medium">
            ⚠️ <strong>High Overlap Detected:</strong> Similarity exceeds threshold ({nov.threshold_percentage}%). Revise methodology before capstone submission.
          </div>
        )}

        {/* Top 3 Nearest Matches */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-mono uppercase text-[#78716c] block">
            Top Nearest Historical Matches:
          </span>
          {nov.top_matches.map((m, idx) => (
            <div key={idx} className="bg-[#faf7f2] border border-[#e7e2d8] rounded p-2 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1c1917] line-clamp-1">{m.title}</span>
                <span className="font-mono text-[11px] font-bold text-[#1d6e5c] shrink-0 ml-2">
                  {m.similarity_percentage}% match
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#78716c]">
                <span>{m.source_type}</span>
                <span>{m.domain}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'hireability') {
    const hire = data as HireabilityResult;

    const getHireabilitySummary = () => {
      if (hire.hireability_score >= 75) {
        return 'In-demand stack — strongly aligns with current industry hiring trends.';
      }
      if (hire.hireability_score >= 50) {
        return 'Solid market demand across software and engineering roles.';
      }
      return 'Niche stack — specialized industry application with targeted job fit.';
    };

    return (
      <div className="academic-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2">
          <div>
            <span className="text-[11px] font-mono uppercase text-[#78716c] font-semibold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#1d6e5c]" />
              Placement Relevance
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-serif-heading font-bold text-2xl text-[#1c1917]">{hire.hireability_score}%</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                HIGH DEMAND
              </span>
            </div>
          </div>

          {!isSimple ? (
            <div className="text-right font-mono text-[11px] text-[#57534e]">
              <div>Avg Demand: <strong>{Math.round(hire.average_market_frequency * 100)}%</strong></div>
              <div>Source: <strong>Job Index 2026</strong></div>
            </div>
          ) : (
            <details className="text-right font-mono text-[10px] text-[#78716c] cursor-pointer">
              <summary className="hover:text-[#1d6e5c]">Market metrics</summary>
              <div className="mt-1 bg-[#faf7f2] p-1.5 rounded border border-[#e7e2d8]">
                <div>Avg Demand: {Math.round(hire.average_market_frequency * 100)}%</div>
                <div>Source: Job Index 2026</div>
              </div>
            </details>
          )}
        </div>

        {/* Sitewide One-Line Plain Language Explanation */}
        <div className="text-xs font-sans text-[#44403c] bg-[#faf7f2] border border-[#e7e2d8] rounded-md px-2.5 py-1.5 font-medium leading-snug">
          <span className="text-[#1d6e5c] font-bold font-mono mr-1">{hire.hireability_score}% Hireability</span>
          — {getHireabilitySummary()}
        </div>

        {/* Stack Market Demand Bars */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase text-[#78716c] block">
            Tech Stack Hiring Frequency Data Points:
          </span>
          {hire.stack_insights.map((s, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#1c1917]">{s.technology}</span>
                <span className="font-mono text-[#1d6e5c] font-bold">{s.market_percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#e7e2d8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1d6e5c] rounded-full"
                  style={{ width: `${s.market_percentage}%` }}
                />
              </div>
              {!compact && <p className="text-[10px] text-[#78716c] italic">{s.market_insight}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Type: Match / Skill Coverage
  const cov = data as SkillCoverageBreakdown;

  const getMatchSummary = () => {
    if (cov.coverage_percentage >= 80) {
      return 'Strong fit — your declared skills cover the core requirements.';
    }
    if (cov.coverage_percentage >= 50) {
      return `Good fit — requires ~${cov.estimated_bridging_weeks} weeks of prep on prerequisites.`;
    }
    return `Steep learning curve — ${cov.gap_severity} gap points to bridge before starting.`;
  };

  return (
    <div className="academic-card p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2">
        <div>
          <span className="text-[11px] font-mono uppercase text-[#78716c] font-semibold flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#1d6e5c]" />
            Skill Coverage & Match
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-serif-heading font-bold text-2xl text-[#1c1917]">{cov.coverage_percentage}%</span>
            <span className="text-xs text-[#57534e]">
              ({cov.matched_count}/{cov.total_required} skills ready)
            </span>
          </div>
        </div>

        {!isSimple ? (
          <div className="text-right font-mono text-[11px] text-[#57534e]">
            <div>Gap Severity: <strong>{cov.gap_severity} pts</strong></div>
            <div>Bridge Time: <strong>{cov.estimated_bridging_weeks} wks</strong></div>
          </div>
        ) : (
          <details className="text-right font-mono text-[10px] text-[#78716c] cursor-pointer">
            <summary className="hover:text-[#1d6e5c]">Gap metrics</summary>
            <div className="mt-1 bg-[#faf7f2] p-1.5 rounded border border-[#e7e2d8]">
              <div>Gap Severity: {cov.gap_severity} pts</div>
              <div>Bridge Time: {cov.estimated_bridging_weeks} wks</div>
            </div>
          </details>
        )}
      </div>

      {/* Sitewide One-Line Plain Language Explanation */}
      <div className="text-xs font-sans text-[#44403c] bg-[#faf7f2] border border-[#e7e2d8] rounded-md px-2.5 py-1.5 font-medium leading-snug">
        <span className="text-[#1d6e5c] font-bold font-mono mr-1">{cov.coverage_percentage}% Match</span>
        — {getMatchSummary()}
      </div>

      {/* Topological Learning Pathway Preview */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-mono uppercase text-[#78716c] block">
          Topological Prerequisite Pathway:
        </span>
        {cov.topological_learning_pathway.length === 0 ? (
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> All required skills fully mastered!
          </p>
        ) : (
          cov.topological_learning_pathway.slice(0, 4).map((node, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs bg-[#faf7f2] p-1.5 rounded border border-[#e7e2d8]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#1d6e5c]/10 text-[#1d6e5c] font-mono text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <span className="font-semibold text-[#1c1917]">{node.skill_name}</span>
                  {node.is_prerequisite_ancestor && (
                    <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-800 font-mono px-1 rounded">
                      Prerequisite
                    </span>
                  )}
                </div>
              </div>
              <span className="font-mono text-[11px] text-[#78716c]">
                ~{node.estimated_hours} hrs
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
