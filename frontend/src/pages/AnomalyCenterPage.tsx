import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { api, AnomalyItem } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { useToast } from '../context/ToastContext';

export const AnomalyCenterPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
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
      toast.success('Anomaly Resolved', 'Exception cleared and logged in audit ledger');
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast.error('Resolution Failed', 'Could not save anomaly resolution');
    },
  });

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#374151] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F9FAFB] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#F87171]" />
            Anomaly & Exception Center
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Deterministic arithmetic discrepancies, duplicate detections, and vendor price drift alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#F9FAFB] font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={unresolvedOnly}
              onChange={(e) => setUnresolvedOnly(e.target.checked)}
              className="rounded bg-[#111827] border-[#374151] text-[#10B981] focus:ring-0"
            />
            Show Unresolved Only
          </label>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#9CA3AF]">Loading anomaly records...</div>
        ) : anomalies && anomalies.length > 0 ? (
          anomalies.map((anom) => {
            let affectedFieldsArray: string[] = [];
            try {
              affectedFieldsArray = JSON.parse(anom.affected_fields);
            } catch {
              affectedFieldsArray = [];
            }

            const isCritical = anom.severity === 'critical';

            return (
              <div
                key={anom.id}
                className={`p-4 rounded-xl border transition-all ${
                  anom.is_resolved
                    ? 'bg-[#1F2937]/50 border-[#374151] opacity-75'
                    : isCritical
                    ? 'bg-[#1F2937] border-[#F87171]/40'
                    : 'bg-[#1F2937] border-[#F59E0B]/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={anom.severity} size="sm" />
                      <span className="font-mono text-xs font-bold text-[#9CA3AF]">
                        {anom.rule_code}
                      </span>
                      {anom.is_resolved && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          Resolved ({anom.resolution_action})
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#F9FAFB]">{anom.title}</h3>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">{anom.message}</p>

                    {affectedFieldsArray.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-[#6B7280] font-semibold">
                          Affected Fields:
                        </span>
                        {affectedFieldsArray.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-[#111827] text-[#9CA3AF] font-mono text-[10px] border border-[#374151]"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {anom.is_resolved && anom.resolution_note && (
                      <p className="text-[11px] text-[#9CA3AF] italic mt-1">
                        Audit Note: "{anom.resolution_note}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <Link
                      to={`/workspace?docId=${anom.document_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#283548] text-[#F9FAFB] text-xs font-semibold border border-[#374151] btn-transition"
                    >
                      <span>Inspect Document</span>
                      <ExternalLink className="w-3 h-3 text-[#9CA3AF]" />
                    </Link>

                    {!anom.is_resolved && (
                      <button
                        onClick={() => setSelectedAnomaly(anom)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold btn-transition"
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
          <div className="p-16 text-center rounded-xl border border-[#374151] bg-[#1F2937] text-[#9CA3AF] text-xs">
            <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto mb-2" />
            <p className="font-bold text-[#F9FAFB]">Zero Unresolved Anomalies</p>
            <p className="mt-1">
              All processed financial documents have verified arithmetic, unique hashes, and valid tax fields.
            </p>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="w-full max-w-md rounded-xl bg-[#1F2937] border border-[#374151] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3">
              <h3 className="text-sm font-bold text-[#F9FAFB]">Resolve Exception</h3>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="p-1 rounded text-[#9CA3AF] hover:text-[#F9FAFB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-[#F9FAFB]">{selectedAnomaly.title}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">{selectedAnomaly.message}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                Resolution Action
              </label>
              <CustomDropdown
                value={resolutionAction}
                onChange={setResolutionAction}
                className="w-full"
                options={[
                  {
                    value: 'ACCEPTED_OVERRIDE',
                    label: 'Accept & Override',
                    description: 'Valid fee, discount, or accepted roundoff',
                  },
                  {
                    value: 'CORRECTED_FIELD',
                    label: 'Manual Field Correction',
                    description: 'Corrected in evidence workbench',
                  },
                  {
                    value: 'DISMISSED',
                    label: 'Dismiss as Non-Actionable',
                    description: 'Informational advisory cleared',
                  },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                Audit Rationale / Note
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] h-20 resize-none focus:outline-none focus:border-[#10B981]"
                placeholder="Explain why this exception is cleared for tax auditing..."
              />
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedAnomaly(null)}
                className="w-1/2 py-2 rounded-lg bg-[#111827] hover:bg-[#283548] text-[#F9FAFB] text-xs font-semibold border border-[#374151] btn-transition"
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
                className="w-1/2 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold btn-transition"
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
