import React, { useState } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { GitHubDriftAnalysis } from '../types';

interface RoadmapTimelineProps {
  driftData: GitHubDriftAnalysis | null;
  isLoading: boolean;
  onRefresh: (repo: string) => void;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({
  driftData,
  isLoading,
  onRefresh
}) => {
  const [repoInput, setRepoInput] = useState<string>(
    driftData?.repository || 'sample-student/capstone-repo'
  );

  if (!driftData) {
    return (
      <div className="academic-card p-6 text-center space-y-3">
        <p className="text-sm text-[#78716c]">Loading GitHub roadmap telemetry...</p>
      </div>
    );
  }

  const isBehind = driftData.drift_status.toLowerCase().includes('behind');
  const isAhead = driftData.drift_status.toLowerCase().includes('ahead');

  return (
    <div className="space-y-6">
      {/* Top Banner: Drift Status & Git Sync */}
      <div className="academic-card p-5 border-l-4" style={{ borderLeftColor: driftData.drift_color }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#1d6e5c]" />
              <span className="font-mono text-xs text-[#78716c]">Repository:</span>
              <span className="font-mono text-xs font-bold text-[#1c1917]">{driftData.repository}</span>
              {driftData.is_live_github && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-bold">
                  LIVE GITHUB API
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="font-serif-heading font-bold text-xl text-[#1c1917]">
                Milestone Drift: {driftData.drift_status}
              </h3>
              <span className="font-mono text-xs font-semibold" style={{ color: driftData.drift_color }}>
                {driftData.drift_delta_days > 0 ? `+${driftData.drift_delta_days}` : driftData.drift_delta_days} days
              </span>
            </div>
            <p className="text-xs text-[#57534e]">
              Comparing week {driftData.current_week} commit velocity against planned {driftData.total_weeks}-week deliverables.
            </p>
          </div>

          {/* Quick repo sync input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo or token"
              className="bg-[#faf7f2] border border-[#d6cfc4] rounded px-2.5 py-1.5 text-xs font-mono text-[#1c1917] w-48 focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            />
            <button
              onClick={() => onRefresh(repoInput)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-[#1d6e5c] text-white rounded text-xs font-semibold hover:bg-[#165648] transition-colors flex items-center gap-1 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>

        {/* Progress Comparison Meter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t border-[#e7e2d8]">
          <div>
            <div className="flex justify-between text-xs font-mono text-[#57534e] mb-1">
              <span>Planned Schedule Velocity:</span>
              <span className="font-bold">{driftData.expected_progress_percentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#e7e2d8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8c827a] rounded-full"
                style={{ width: `${driftData.expected_progress_percentage}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-mono text-[#57534e] mb-1">
              <span>Actual Commit Progress:</span>
              <span className="font-bold" style={{ color: driftData.drift_color }}>
                {driftData.actual_progress_percentage}% ({driftData.total_commits} commits logged)
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#e7e2d8] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${driftData.actual_progress_percentage}%`,
                  backgroundColor: driftData.drift_color
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Week-by-Week Roadmap Timeline Grid */}
      <div className="space-y-3">
        <h4 className="font-serif-heading font-bold text-base text-[#1c1917] flex items-center justify-between">
          <span>Week-by-Week Sprint Timeline with Commit Density</span>
          <span className="text-xs font-mono text-[#78716c]">16 Sprint Milestones</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {driftData.timeline_overlay.map((w) => {
            const isDone = w.is_completed;
            const isCurrent = w.is_current;

            return (
              <div
                key={w.week_number}
                className={`academic-card p-3 text-xs space-y-2 border transition-all ${
                  isCurrent
                    ? 'border-[#1d6e5c] ring-2 ring-[#1d6e5c]/20 bg-[#faf7f2]'
                    : isDone
                    ? 'border-[#d6cfc4] bg-white'
                    : 'border-[#e7e2d8] opacity-70 bg-[#faf7f2]/50'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <span className={`font-bold ${isCurrent ? 'text-[#1d6e5c]' : 'text-[#57534e]'}`}>
                    Week {w.week_number}
                  </span>
                  {isDone ? (
                    <span className="text-emerald-700 flex items-center gap-0.5 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[#1d6e5c] bg-[#1d6e5c]/10 text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                      In Progress
                    </span>
                  ) : (
                    <span className="text-[#a8a29e] text-[10px]">Upcoming</span>
                  )}
                </div>

                <h5 className="font-semibold text-[#1c1917] line-clamp-1">{w.title}</h5>
                <p className="text-[11px] text-[#57534e] line-clamp-2">{w.planned_deliverable}</p>

                {/* Commit Activity Overlay Indicator */}
                <div className="pt-2 border-t border-[#f5f1e8] flex items-center justify-between text-[10px] font-mono text-[#78716c]">
                  <span className="flex items-center gap-1">
                    <GitCommit className="w-3 h-3 text-[#1d6e5c]" />
                    {w.commits_logged} commits
                  </span>
                  <span className="w-2 h-2 rounded-full" style={{
                    backgroundColor: w.commits_logged > 3 ? '#1d6e5c' : w.commits_logged > 0 ? '#c2703d' : '#d6cfc4'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Commit History Feed */}
      <div className="academic-card p-4 space-y-3">
        <h4 className="font-serif-heading font-bold text-sm text-[#1c1917] flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-[#1d6e5c]" />
          Recent Verified Commits
        </h4>
        <div className="divide-y divide-[#f5f1e8]">
          {driftData.recent_commits.map((c, idx) => (
            <div key={idx} className="py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 pr-4">
                <span className="font-mono text-[11px] bg-[#faf7f2] border border-[#d6cfc4] px-1.5 py-0.5 rounded text-[#1d6e5c] font-bold">
                  {c.sha}
                </span>
                <span className="text-[#1c1917] font-medium line-clamp-1">{c.message}</span>
              </div>
              <div className="font-mono text-[11px] text-[#78716c] shrink-0">
                {c.date ? new Date(c.date).toLocaleDateString() : 'Recent'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
