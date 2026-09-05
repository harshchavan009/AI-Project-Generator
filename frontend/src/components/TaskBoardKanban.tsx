import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Layers, 
  GitBranch, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  RefreshCw
} from 'lucide-react';
import { ApiService } from '../services/api';
import { ProjectTask, TaskBoardResponse } from '../types';

interface TaskBoardKanbanProps {
  projectId: string;
  onStatsUpdated?: (completionPercentage: number, driftStatus: string) => void;
}

export const TaskBoardKanban: React.FC<TaskBoardKanbanProps> = ({
  projectId,
  onStatsUpdated
}) => {
  const [boardData, setBoardData] = useState<TaskBoardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // New task form modal/input
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newWeek, setNewWeek] = useState<number>(1);
  const [newIsStretch, setNewIsStretch] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getProjectTasks(projectId);
      setBoardData(data);
      if (onStatsUpdated) {
        onStatsUpdated(data.completion_percentage, data.drift_status);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch task board');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const handleUpdateStatus = async (taskId: string, nextStatus: 'Not Started' | 'In Progress' | 'Completed') => {
    try {
      await ApiService.updateTaskStatus(taskId, { status: nextStatus });
      // Optimistic update local state then refresh stats
      setBoardData((prev) => {
        if (!prev) return null;
        const updatedTasks = prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: nextStatus } : t
        );
        const total = updatedTasks.length;
        const completed = updatedTasks.filter((t) => t.status === 'Completed').length;
        const inProg = updatedTasks.filter((t) => t.status === 'In Progress').length;
        const notStart = updatedTasks.filter((t) => t.status === 'Not Started').length;
        const pct = Math.round((completed / Math.max(1, total)) * 100);
        const drift = pct >= 60 ? 'Ahead of Schedule' : pct < 20 ? 'Behind Schedule (Milestone Slip Risk)' : 'On Track';

        if (onStatsUpdated) {
          onStatsUpdated(pct, drift);
        }

        return {
          ...prev,
          tasks: updatedTasks,
          completed_tasks: completed,
          in_progress_tasks: inProg,
          not_started_tasks: notStart,
          completion_percentage: pct,
          drift_status: drift
        };
      });
    } catch (err: any) {
      console.error('Task status update failed:', err);
      fetchTasks();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await ApiService.createProjectTask(projectId, {
        title: newTitle.trim(),
        status: 'Not Started',
        linked_week: newWeek,
        is_stretch: newIsStretch
      });
      setNewTitle('');
      setShowAddModal(false);
      fetchTasks();
    } catch (err: any) {
      console.error('Failed to create task:', err);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading && !boardData) {
    return (
      <div className="academic-card p-8 text-center space-y-2 text-xs font-mono text-[#78716c] animate-pulse">
        <RefreshCw className="w-5 h-5 text-[#1d6e5c] mx-auto animate-spin" />
        <p>Initializing Kanban board from week-by-week deliverable backlog...</p>
      </div>
    );
  }

  const tasks = boardData?.tasks || [];
  const notStartedTasks = tasks.filter((t) => t.status === 'Not Started');
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');
  const completedTasks = tasks.filter((t) => t.status === 'Completed');

  const getDriftColor = (drift: string) => {
    if (drift.includes('Ahead')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (drift.includes('Behind')) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="academic-card p-6 border border-[#d6cfc4] space-y-6 bg-white rounded-xl shadow-sm">
      {/* Header and Live Velocity Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e7e2d8] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#78716c] uppercase mb-1">
            <span className="text-[#1d6e5c] font-bold">Feature 4</span>
            <span>•</span>
            <span>Roadmap Backlog & Stack Boilerplate Kanban</span>
          </div>
          <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1d6e5c]" />
            Sprint Task Board & Faculty Drift Feeder
          </h3>
          <p className="text-xs text-[#57534e]">
            Derived automatically from your deliverable roadmap and stack boilerplates. Task completion percentage 
            directly updates the faculty progress and GitHub drift indicator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Velocity & Drift Badge */}
          {boardData && (
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className={`px-2.5 py-1 rounded-full font-bold border ${getDriftColor(boardData.drift_status)}`}>
                {boardData.drift_status}
              </span>
              <div className="bg-[#faf7f2] border border-[#d6cfc4] px-2.5 py-1 rounded text-[#1c1917]">
                <strong>{boardData.completed_tasks}</strong> / {boardData.total_tasks} ({boardData.completion_percentage}%)
              </div>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#1d6e5c] text-white rounded-lg text-xs font-semibold hover:bg-[#165648] transition-colors flex items-center gap-1 shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Not Started */}
        <div className="bg-[#faf7f2] border border-[#e7e2d8] rounded-xl p-3.5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2">
            <span className="font-mono text-xs font-bold text-[#78716c] flex items-center gap-1.5">
              <Circle className="w-3.5 h-3.5 text-[#78716c]" />
              Not Started ({notStartedTasks.length})
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {notStartedTasks.map((t) => (
              <div key={t.id} className="bg-white p-3 rounded-lg border border-[#d6cfc4] shadow-xs space-y-2 text-xs">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-semibold text-[#1c1917] leading-tight">{t.title}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#f5f1e8] text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-[#faf7f2] border border-[#e7e2d8] text-[#78716c]">
                      Wk {t.linked_week}
                    </span>
                    {t.is_stretch && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                        Stretch
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'In Progress')}
                    className="text-[#1d6e5c] hover:underline flex items-center gap-0.5"
                    title="Move to In Progress"
                  >
                    Start <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {notStartedTasks.length === 0 && (
              <p className="text-[11px] text-[#a8a29e] text-center py-6">No pending tasks</p>
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-[#faf7f2] border border-[#e7e2d8] rounded-xl p-3.5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2">
            <span className="font-mono text-xs font-bold text-sky-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600 animate-spin" />
              In Progress ({inProgressTasks.length})
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {inProgressTasks.map((t) => (
              <div key={t.id} className="bg-white p-3 rounded-lg border-2 border-sky-200 shadow-xs space-y-2 text-xs">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-semibold text-[#1c1917] leading-tight">{t.title}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#f5f1e8] text-[10px] font-mono">
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'Not Started')}
                    className="text-[#78716c] hover:underline flex items-center gap-0.5"
                  >
                    <ChevronLeft className="w-3 h-3" /> Back
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-[#faf7f2] border border-[#e7e2d8] text-[#78716c]">
                      Wk {t.linked_week}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'Completed')}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                    title="Mark Done"
                  >
                    Done <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {inProgressTasks.length === 0 && (
              <p className="text-[11px] text-[#a8a29e] text-center py-6">No tasks in progress</p>
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="bg-[#faf7f2] border border-[#e7e2d8] rounded-xl p-3.5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2">
            <span className="font-mono text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Completed ({completedTasks.length})
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {completedTasks.map((t) => (
              <div key={t.id} className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 shadow-xs space-y-2 text-xs">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-semibold text-emerald-950 line-through opacity-85 leading-tight">
                    {t.title}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-100 text-[10px] font-mono">
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'In Progress')}
                    className="text-[#78716c] hover:underline flex items-center gap-0.5"
                  >
                    <ChevronLeft className="w-3 h-3" /> Reopen
                  </button>
                  <span className="text-emerald-700 font-bold">✓ Verified</span>
                </div>
              </div>
            ))}
            {completedTasks.length === 0 && (
              <p className="text-[11px] text-[#a8a29e] text-center py-6">No completed tasks yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 border border-[#d6cfc4] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
              <h4 className="font-serif-heading font-bold text-base text-[#1c1917]">
                Add Custom Engineering Task
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#78716c] hover:text-[#1c1917] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[10px] uppercase text-[#78716c] block mb-1">
                  Task Title / Deliverable:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Write integration tests for ONNX inference pipeline"
                  className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded p-2 text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#78716c] block mb-1">
                    Linked Sprint Week:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={newWeek}
                    onChange={(e) => setNewWeek(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded p-2 text-[#1c1917]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isStretch"
                    checked={newIsStretch}
                    onChange={(e) => setNewIsStretch(e.target.checked)}
                    className="accent-[#1d6e5c]"
                  />
                  <label htmlFor="isStretch" className="font-mono text-[11px] text-[#1c1917]">
                    Stretch Goal
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e7e2d8]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-[#d6cfc4] text-[#78716c] hover:bg-[#faf7f2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="px-4 py-1.5 bg-[#1d6e5c] text-white rounded font-semibold hover:bg-[#165648] disabled:opacity-50"
                >
                  {isCreating ? 'Adding...' : 'Add to Kanban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
