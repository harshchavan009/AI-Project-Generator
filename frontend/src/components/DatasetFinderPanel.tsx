import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  FileText, 
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';
import { ApiService } from '../services/api';
import { DatasetFindResponse, DatasetItem } from '../types';

interface DatasetFinderPanelProps {
  ideaTitle: string;
  ideaDescription: string;
  domain?: string;
}

export const DatasetFinderPanel: React.FC<DatasetFinderPanelProps> = ({
  ideaTitle,
  ideaDescription,
  domain = ''
}) => {
  const [dataResult, setDataResult] = useState<DatasetFindResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');

  const runDatasetSearch = async (queryText: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiService.findDatasets(queryText, domain, 3);
      setDataResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to search research datasets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ideaTitle || ideaDescription) {
      runDatasetSearch(`${ideaTitle}. ${ideaDescription}`);
    }
  }, [ideaTitle, ideaDescription, domain]);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchQuery.trim() || isLoading) return;
    runDatasetSearch(customSearchQuery.trim());
  };

  return (
    <div className="academic-card p-6 border border-[#d6cfc4] space-y-5 bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e2d8] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#78716c] uppercase mb-1">
            <span className="text-[#1d6e5c] font-bold">Feature 6</span>
            <span>•</span>
            <span>Zero-Hallucination Curated Research Dataset Index</span>
          </div>
          <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#1d6e5c]" />
            Public Research Dataset Finder
          </h3>
          <p className="text-xs text-[#57534e]">
            Grounds your machine learning and data-heavy architecture in real, public, peer-reviewed datasets. 
            If no verified dataset exists for your scope, the system explicitly alerts you rather than inventing fake data sources.
          </p>
        </div>

        {/* Refresh / Re-query */}
        <button
          onClick={() => runDatasetSearch(`${ideaTitle}. ${ideaDescription}`)}
          disabled={isLoading}
          className="text-xs font-mono text-[#78716c] hover:text-[#1d6e5c] flex items-center gap-1 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Re-match Datasets
        </button>
      </div>

      {/* Quick Search Bar */}
      <form onSubmit={handleCustomSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#78716c] absolute left-3 top-2.5" />
          <input
            type="text"
            value={customSearchQuery}
            onChange={(e) => setCustomSearchQuery(e.target.value)}
            placeholder={`Search public datasets in ${domain || 'current domain'}...`}
            className="w-full pl-8 pr-3 py-1.5 bg-[#faf7f2] border border-[#d6cfc4] rounded-lg text-xs text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !customSearchQuery.trim()}
          className="px-3 py-1.5 bg-[#1d6e5c] text-white rounded-lg text-xs font-semibold hover:bg-[#165648] disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center space-y-2 text-xs font-mono text-[#78716c] animate-pulse">
          <RefreshCw className="w-5 h-5 text-[#1d6e5c] mx-auto animate-spin" />
          <p>Scanning curated open-data repository registry via FastEmbed embeddings...</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Matched Datasets Cards */}
      {!isLoading && dataResult && (
        <div className="space-y-4">
          {dataResult.match_found && dataResult.matched_datasets.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{dataResult.message}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dataResult.matched_datasets.map((ds: DatasetItem) => (
                  <div key={ds.id} className="bg-[#faf7f2] p-4 rounded-xl border border-[#d6cfc4] space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#e7e2d8] text-[#1d6e5c] font-bold">
                          {ds.source}
                        </span>
                        <span className="text-[10px] font-mono text-[#78716c]">
                          Similarity: {Math.round(ds.similarity_score * 100)}%
                        </span>
                      </div>
                      <h4 className="font-serif-heading font-bold text-sm text-[#1c1917]">
                        {ds.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#78716c]">
                        <span>Size: <strong>{ds.size}</strong></span>
                        <span>•</span>
                        <span>License: <strong>{ds.license}</strong></span>
                      </div>
                    </div>

                    {/* Features / Target variable */}
                    <div className="space-y-1.5 text-xs">
                      {ds.columns_fields && ds.columns_fields.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#78716c] block">Available Columns:</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {ds.columns_fields.slice(0, 4).map((col, idx) => (
                              <span key={idx} className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#e7e2d8] text-[#1c1917]">
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-[11px] text-[#57534e] bg-white/80 p-2 rounded border border-[#e7e2d8] italic">
                        <strong>Suitability Note:</strong> {ds.suitability_notes}
                      </p>
                    </div>

                    <a
                      href={ds.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 bg-white border border-[#d6cfc4] hover:border-[#1d6e5c] text-[#1d6e5c] font-semibold text-xs rounded-lg transition-colors shadow-xs"
                    >
                      Access Dataset Repository
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Explicit Absence of Match Card */
            <div className="p-5 bg-amber-50/70 border-2 border-amber-200/80 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No Verified Public Research Dataset Match Found</span>
              </div>
              <p className="text-xs text-[#57534e] leading-relaxed">
                {dataResult.message}
              </p>
              <div className="bg-white/80 p-3 rounded-lg border border-amber-200 text-xs text-[#1c1917] space-y-1">
                <strong className="block font-mono text-[10px] uppercase text-amber-800">
                  Faculty Viva Voce Warning:
                </strong>
                <p>
                  Projects relying on private, non-existent, or proprietary sensor data risk immediate disqualification 
                  during committee evaluation. If you cannot obtain public data, scope down to synthetic simulation or 
                  benchmarks with verified public data.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
