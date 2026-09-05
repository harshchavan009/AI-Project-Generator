import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  BarChart3, 
  Upload, 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Layers,
  GitBranch,
  Building,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  CohortStudent, 
  DuplicateCluster, 
  DifficultyDistribution 
} from '../types';
import { ApiService } from '../services/api';

export const FacultyConsolePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roster' | 'duplicates' | 'distribution'>('roster');
  const [students, setStudents] = useState<CohortStudent[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCluster[]>([]);
  const [distribution, setDistribution] = useState<DifficultyDistribution | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sorting & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [driftFilter, setDriftFilter] = useState('ALL');
  const [sortField, setSortField] = useState<keyof CohortStudent>('novelty_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Archive Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAbstract, setUploadAbstract] = useState('');
  const [uploadDomain, setUploadDomain] = useState('General Engineering');
  const [uploadMsg, setUploadMsg] = useState('');

  const loadFacultyData = async () => {
    setIsLoading(true);
    try {
      const [stds, dups, dist] = await Promise.all([
        ApiService.getCohortStudents('cohort-cse-2026-a'),
        ApiService.getCohortDuplicates('cohort-cse-2026-a', 0.68),
        ApiService.getCohortDifficultyDistribution('cohort-cse-2026-a')
      ]);
      setStudents(stds);
      setDuplicates(dups);
      setDistribution(dist);
    } catch (err) {
      console.error('Faculty console load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, []);

  const handleSort = (field: keyof CohortStudent) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleUploadArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadAbstract.trim()) return;

    try {
      const res = await ApiService.uploadArchive(uploadTitle, uploadAbstract, uploadDomain, 2025);
      setUploadMsg(res.message);
      setUploadTitle('');
      setUploadAbstract('');
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadMsg('');
        loadFacultyData();
      }, 1200);
    } catch (err: any) {
      setUploadMsg(`Error: ${err.message}`);
    }
  };

  // Filtered & Sorted Students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.idea_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.domain.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDrift =
      driftFilter === 'ALL' ||
      (driftFilter === 'BEHIND' && s.drift_status.toLowerCase().includes('behind')) ||
      (driftFilter === 'ON_TRACK' && s.drift_status.toLowerCase().includes('on track')) ||
      (driftFilter === 'AHEAD' && s.drift_status.toLowerCase().includes('ahead'));

    return matchesSearch && matchesDrift;
  });

  filteredStudents.sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    return sortOrder === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Faculty Console Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e7e2d8] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#78716c] uppercase mb-1">
            <Building className="w-3.5 h-3.5 text-[#1d6e5c]" />
            <span>Academic Oversight Console</span>
            <span>•</span>
            <span className="text-[#1d6e5c] font-bold">CSE Capstone Cohort 2026</span>
          </div>
          <h1 className="font-serif-heading font-bold text-3xl sm:text-4xl text-[#1c1917]">
            Faculty Oversight & Duplicate Prevention
          </h1>
          <p className="text-sm text-[#57534e] mt-1 max-w-2xl">
            Monitor proposal novelty, feasibility stress, and GitHub commit drift across your assigned cohort.
            Detect duplicate topic convergence early before final university registration.
          </p>
        </div>

        {/* Action: Upload historical capstone archive */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-white border border-[#d6cfc4] hover:border-[#1d6e5c] rounded-lg text-xs font-semibold text-[#1c1917] transition-all shadow-sm flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-[#1d6e5c]" />
            Upload Department Archive
          </button>
          <button
            onClick={loadFacultyData}
            disabled={isLoading}
            className="p-2 bg-[#faf7f2] border border-[#d6cfc4] rounded-lg text-[#1c1917] hover:bg-[#ede8df] transition-colors"
            title="Refresh Cohort Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cohort Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        <div className="academic-card p-4 space-y-1">
          <span className="text-[#78716c] block text-[10px] uppercase">Enrolled Cohort Size</span>
          <span className="font-serif-heading font-bold text-2xl text-[#1c1917]">{students.length} Students</span>
          <span className="text-[10px] text-[#57534e] block">Assigned Advisor: Dr. V. Ramanathan</span>
        </div>
        <div className="academic-card p-4 space-y-1">
          <span className="text-[#78716c] block text-[10px] uppercase">Flagged Duplicate Clusters</span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif-heading font-bold text-2xl text-[#c2703d]">{duplicates.length} Clusters</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 rounded font-bold">Requires Action</span>
          </div>
          <span className="text-[10px] text-[#57534e] block">Embedding threshold: 68% sim</span>
        </div>
        <div className="academic-card p-4 space-y-1">
          <span className="text-[#78716c] block text-[10px] uppercase">Mean Cohort Feasibility</span>
          <span className="font-serif-heading font-bold text-2xl text-[#1d6e5c]">{distribution?.feasibility_mean || 75}%</span>
          <span className="text-[10px] text-emerald-700 block">Balanced Implementation Load</span>
        </div>
        <div className="academic-card p-4 space-y-1">
          <span className="text-[#78716c] block text-[10px] uppercase">Milestone Slip Risk</span>
          <span className="font-serif-heading font-bold text-2xl text-rose-700">
            {students.filter((s) => s.drift_status.toLowerCase().includes('behind')).length} Students
          </span>
          <span className="text-[10px] text-rose-600 block">Git velocity below roadmap</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e7e2d8] pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'bg-[#1d6e5c] text-white shadow-sm'
              : 'bg-white text-[#57534e] border border-[#d6cfc4] hover:bg-[#ede8df]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Cohort Student Roster Table
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'duplicates'
              ? 'bg-[#1d6e5c] text-white shadow-sm'
              : 'bg-white text-[#57534e] border border-[#d6cfc4] hover:bg-[#ede8df]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Duplicate Detection Radar ({duplicates.length})
        </button>
        <button
          onClick={() => setActiveTab('distribution')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'distribution'
              ? 'bg-[#1d6e5c] text-white shadow-sm'
              : 'bg-white text-[#57534e] border border-[#d6cfc4] hover:bg-[#ede8df]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Difficulty & Rigor Distribution
        </button>
      </div>

      {/* Tab 1: Cohort Student Roster Table */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Table Toolbar */}
          <div className="academic-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[#78716c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students, proposal titles, or domains..."
                className="w-full bg-transparent text-[#1c1917] placeholder-[#a8a29e] focus:outline-none font-sans text-xs"
              />
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#78716c]">Drift Filter:</span>
              <select
                value={driftFilter}
                onChange={(e) => setDriftFilter(e.target.value)}
                className="bg-[#faf7f2] border border-[#d6cfc4] rounded px-2 py-1 text-xs text-[#1c1917] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="BEHIND">Behind Schedule (Risks)</option>
                <option value="ON_TRACK">On Track</option>
                <option value="AHEAD">Ahead</option>
              </select>
            </div>
          </div>

          {/* Sortable Table */}
          <div className="academic-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#faf7f2] border-b border-[#e7e2d8] text-[#57534e] font-mono text-[11px] uppercase">
                  <tr>
                    <th className="p-3 cursor-pointer" onClick={() => handleSort('student_name')}>
                      <span className="flex items-center gap-1">Student & Branch <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="p-3 cursor-pointer" onClick={() => handleSort('idea_title')}>
                      <span className="flex items-center gap-1">Adopted Capstone Title <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="p-3 cursor-pointer text-center" onClick={() => handleSort('novelty_score')}>
                      <span className="flex items-center justify-center gap-1">Novelty <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="p-3 cursor-pointer text-center" onClick={() => handleSort('feasibility_score')}>
                      <span className="flex items-center justify-center gap-1">Feasibility <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="p-3 cursor-pointer text-center" onClick={() => handleSort('hireability_score')}>
                      <span className="flex items-center justify-center gap-1">Hireability <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="p-3 cursor-pointer text-right" onClick={() => handleSort('drift_status')}>
                      <span className="flex items-center justify-end gap-1">GitHub Drift <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f1e8]">
                  {filteredStudents.map((s) => {
                    const isBehind = s.drift_status.toLowerCase().includes('behind');
                    const isAhead = s.drift_status.toLowerCase().includes('ahead');
                    const isLowNovelty = s.novelty_score < 50;

                    return (
                      <tr key={s.student_id} className="hover:bg-[#faf7f2]/60 transition-colors">
                        {/* Student */}
                        <td className="p-3">
                          <div className="font-bold text-[#1c1917]">{s.student_name}</div>
                          <div className="text-[11px] text-[#78716c] font-mono">
                            {s.branch} • Team of {s.team_size}
                          </div>
                        </td>

                        {/* Title & Domain */}
                        <td className="p-3 max-w-sm">
                          <div className="font-semibold text-[#1c1917] line-clamp-1">{s.idea_title}</div>
                          <div className="text-[10px] text-[#1d6e5c] font-mono font-medium">{s.domain}</div>
                        </td>

                        {/* Novelty */}
                        <td className="p-3 text-center font-mono">
                          <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                            isLowNovelty ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {s.novelty_score}%
                          </span>
                        </td>

                        {/* Feasibility */}
                        <td className="p-3 text-center font-mono font-bold text-[#1c1917]">
                          {s.feasibility_score}%
                        </td>

                        {/* Hireability */}
                        <td className="p-3 text-center font-mono font-semibold text-[#57534e]">
                          {s.hireability_score}%
                        </td>

                        {/* Drift */}
                        <td className="p-3 text-right font-mono">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isBehind
                              ? 'bg-amber-100 text-amber-800'
                              : isAhead
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-blue-50 text-blue-800'
                          }`}>
                            {s.drift_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Duplicate Detection Radar */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          <div className="academic-card p-5 border-l-4 border-l-[#c2703d] space-y-2">
            <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#c2703d]" />
              Embedding-Based Duplicate Convergence Radar
            </h3>
            <p className="text-xs text-[#57534e] leading-relaxed">
              Our local FastEmbed sentence embeddings continuously analyze pairwise cosine similarity across all submitted cohort proposals.
              Groups of students converging on near-identical ideas are clustered below so faculty can intervene before submission deadlines.
            </p>
          </div>

          {duplicates.length === 0 ? (
            <div className="academic-card p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#1d6e5c] mx-auto" />
              <h4 className="font-serif-heading font-bold text-base text-[#1c1917]">No Overlapping Duplicates Detected</h4>
              <p className="text-xs text-[#78716c]">All cohort project topics maintain distinct problem formulations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {duplicates.map((cluster) => (
                <div key={cluster.cluster_id} className="academic-card p-5 space-y-3 border border-amber-200">
                  <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#c2703d] uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {cluster.cluster_id}
                      </span>
                      <span className="text-xs font-semibold text-[#1c1917]">
                        {cluster.students.length} Overlapping Proposals Flagged
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                      Average Similarity: {cluster.average_similarity_percentage}%
                    </span>
                  </div>

                  {/* Student list in cluster */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cluster.students.map((st, i) => (
                      <div key={i} className="bg-[#faf7f2] p-3 rounded-lg border border-[#e7e2d8] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#1c1917]">{st.student_name}</span>
                          <span className="text-[10px] font-mono text-[#78716c]">{st.student_id}</span>
                        </div>
                        <h5 className="font-semibold text-xs text-[#1d6e5c] line-clamp-1">{st.idea_title}</h5>
                        <p className="text-[11px] text-[#57534e]">Domain: {st.domain}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={() => alert(`Advisory notification sent to ${cluster.students.map(s => s.student_name).join(', ')} requesting differentiation of scope.`)}
                      className="px-3.5 py-1.5 bg-[#c2703d] text-white rounded text-xs font-semibold hover:bg-[#a65d2f] transition-colors"
                    >
                      Issue Scope Differentiation Notice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Difficulty & Rigor Distribution */}
      {activeTab === 'distribution' && distribution && (
        <div className="space-y-6">
          <div className="academic-card p-5 space-y-2 border-l-4 border-l-[#1d6e5c]">
            <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center justify-between">
              <span>Cohort Difficulty & Novelty Rigor Assessment</span>
              <span className="text-xs font-mono text-[#1d6e5c] font-bold bg-[#1d6e5c]/10 px-2 py-0.5 rounded">
                Status: {distribution.batch_skew_assessment}
              </span>
            </h3>
            <p className="text-xs text-[#57534e]">
              Histograms evaluate whether the batch skews excessively easy (under-ambitious) or excessively difficult (high risk of incomplete defense).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feasibility Histogram */}
            <div className="academic-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif-heading font-bold text-base text-[#1c1917]">
                  Feasibility Score Distribution
                </h4>
                <span className="font-mono text-xs text-[#78716c]">Mean: {distribution.feasibility_mean}%</span>
              </div>
              <div className="space-y-3">
                {distribution.feasibility_histogram.map((bin, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-[#57534e]">
                      <span>{bin.range_label}</span>
                      <span className="font-bold text-[#1c1917]">{bin.count} students</span>
                    </div>
                    <div className="w-full h-3 bg-[#e7e2d8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1d6e5c] rounded-full"
                        style={{ width: `${(bin.count / Math.max(1, distribution.total_students)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Novelty Histogram */}
            <div className="academic-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif-heading font-bold text-base text-[#1c1917]">
                  Novelty Score Distribution
                </h4>
                <span className="font-mono text-xs text-[#78716c]">Mean: {distribution.novelty_mean}%</span>
              </div>
              <div className="space-y-3">
                {distribution.novelty_histogram.map((bin, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-[#57534e]">
                      <span>{bin.range_label}</span>
                      <span className="font-bold text-[#1c1917]">{bin.count} students</span>
                    </div>
                    <div className="w-full h-3 bg-[#e7e2d8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c2703d] rounded-full"
                        style={{ width: `${(bin.count / Math.max(1, distribution.total_students)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upload Department Archive */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-[#d6cfc4] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-3">
              <h3 className="font-serif-heading font-bold text-lg text-[#1c1917]">
                Upload Past Department Capstone Abstract
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-xs font-mono text-[#78716c] hover:text-[#1c1917]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUploadArchive} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-[#78716c] uppercase block">Capstone Title</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Distributed Video Transcoding using FFMPEG"
                  className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-[#78716c] uppercase block">Domain</label>
                <input
                  type="text"
                  value={uploadDomain}
                  onChange={(e) => setUploadDomain(e.target.value)}
                  placeholder="Distributed Systems / AI"
                  className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-[#78716c] uppercase block">Abstract & Methodology</label>
                <textarea
                  required
                  rows={4}
                  value={uploadAbstract}
                  onChange={(e) => setUploadAbstract(e.target.value)}
                  placeholder="Detailed description of methodology and system architecture to index for novelty checking..."
                  className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
                />
              </div>

              {uploadMsg && (
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded text-xs font-mono">
                  {uploadMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e7e2d8]">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3 py-1.5 rounded text-xs text-[#57534e] hover:bg-[#ede8df]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1d6e5c] text-white rounded text-xs font-semibold hover:bg-[#165648]"
                >
                  Index into Vector Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
