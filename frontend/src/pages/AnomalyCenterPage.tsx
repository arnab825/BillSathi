import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  Search,
  Filter,
} from 'lucide-react';
import { api, AnomalyItem } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';

export const AnomalyCenterPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);
  const [resolutionAction, setResolutionAction] = useState('ACCEPTED_OVERRIDE');
  const [resolutionNote, setResolutionNote] = useState('');

  const { data: anomalies, isLoading } = useQuery({
    queryKey: ['anomaliesList', unresolvedOnly],
    queryFn: () => api.listAnomalies(unresolvedOnly),
    refetchInterval: 5000,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: string; note: string }) =>
      api.resolveAnomaly(id, action, note),
    onSuccess: () => {
      setSelectedAnomaly(null);
      setResolutionNote('');
      queryClient.invalidateQueries();
    },
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            Anomaly Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explainable financial discrepancies, duplicate checks, and vendor price drift.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={unresolvedOnly}
              onChange={(e) => setUnresolvedOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            Show Unresolved Only
          </label>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading anomalies...</div>
        ) : anomalies && anomalies.length > 0 ? (
          anomalies.map((anom) => {
            let affectedFieldsArray: string[] = [];
            try {
              affectedFieldsArray = JSON.parse(anom.affected_fields);
            } catch {
              affectedFieldsArray = [];
            }

            return (
              <div
                key={anom.id}
                className={`p-5 rounded-2xl border transition-all ${
                  anom.is_resolved
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-70'
                    : anom.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : anom.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-cyan-950/20 border-cyan-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={anom.severity} size="sm" />
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {anom.rule_code}
                      </span>
                      {anom.is_resolved && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Resolved ({anom.resolution_action})
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">{anom.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{anom.message}</p>

                    {affectedFieldsArray.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500 font-semibold">
                          Affected Fields:
                        </span>
                        {affectedFieldsArray.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {anom.is_resolved && anom.resolution_note && (
                      <p className="text-[11px] text-slate-400 italic">
                        Resolution Note: "{anom.resolution_note}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <Link
                      to={`/workspace?docId=${anom.document_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      <span>View Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {!anom.is_resolved && (
                      <button
                        onClick={() => setSelectedAnomaly(anom)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Resolve Warning
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-slate-300">Zero Unresolved Anomalies</p>
            <p className="mt-1">
              All processed financial documents have verified arithmetic, unique hashes, and valid tax fields.
            </p>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Resolve Anomaly</h3>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-indigo-400">{selectedAnomaly.title}</p>
              <p className="text-xs text-slate-300 mt-1">{selectedAnomaly.message}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Resolution Action
              </label>
              <select
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="ACCEPTED_OVERRIDE">Accept & Override (Valid Discrepancy/Fee)</option>
                <option value="CORRECTED_FIELD">Manual Field Correction Applied</option>
                <option value="DISMISSED">Dismiss as Non-Actionable</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Audit Rationale / Note
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white h-20 resize-none focus:outline-none focus:border-indigo-500"
                placeholder="Explain why this anomaly was cleared for tax auditing..."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAnomaly(null)}
                className="w-1/2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resolveMutation.isPending}
                onClick={() =>
                  resolveMutation.mutate({
                    id: selectedAnomaly.id,
                    action: resolutionAction,
                    note: resolutionNote,
                  })
                }
                className="w-1/2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
