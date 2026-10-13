import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Edit2,
  Save,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calculator,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  CheckCheck,
  UserCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { api, ExtractedFieldItem } from '../api/client';
import { StatusBadge, VerificationTierBadge, formatCents } from '../components/common/StatusBadge';

export const EvidenceWorkspacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const docIdParam = searchParams.get('docId');

  // Fetch list of documents for selector
  const { data: documents } = useQuery({
    queryKey: ['documentsList'],
    queryFn: () => api.listDocuments(),
  });

  const selectedDocId = docIdParam || (documents && documents.length > 0 ? documents[0].id : null);

  // Fetch active document detail
  const { data: doc, isLoading } = useQuery({
    queryKey: ['documentDetail', selectedDocId],
    queryFn: () => (selectedDocId ? api.getDocument(selectedDocId) : null),
    enabled: !!selectedDocId,
  });

  const [activePage, setActivePage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedField, setSelectedField] = useState<ExtractedFieldItem | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editNote, setEditNote] = useState('');
  const [reviewerName, setReviewerName] = useState('Human Reviewer');

  // When doc changes, select first field
  useEffect(() => {
    if (doc?.extracted_fields && doc.extracted_fields.length > 0) {
      setSelectedField(doc.extracted_fields[0]);
    }
  }, [doc]);

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: ({ fieldId, value, note }: { fieldId: string; value: string; note: string }) =>
      api.updateField(fieldId, value, note),
    onSuccess: () => {
      setEditingFieldId(null);
      queryClient.invalidateQueries({ queryKey: ['documentDetail', selectedDocId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  // Confirm record mutation
  const confirmMutation = useMutation({
    mutationFn: (recId: string) => api.confirmRecord(recId, reviewerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentDetail', selectedDocId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['documentsList'] });
    },
  });

  if (!selectedDocId || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-[#10B981] animate-spin" />
          <p className="text-xs text-[#9CA3AF]">Loading evidence workbench...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-12 text-center text-[#9CA3AF]">
        <p>No document selected. Upload a file in Intake or seed demo invoices.</p>
        <Link to="/intake" className="text-[#10B981] hover:underline mt-2 inline-block">
          Go to Intake
        </Link>
      </div>
    );
  }

  const fin = doc.financial_record;
  const isConfirmed = fin?.status === 'Confirmed';

  // Compute arithmetic discrepancy
  const subtotalCents = fin?.subtotal_cents ?? 0;
  const taxCents = fin?.tax_cents ?? 0;
  const totalCents = fin?.total_cents ?? 0;
  const mathExpected = subtotalCents + taxCents;
  const hasMathMismatch = subtotalCents > 0 && totalCents > 0 && mathExpected !== totalCents;

  // Selected field bbox parsing
  let parsedBbox: number[] | null = null;
  if (selectedField?.bbox_json) {
    try {
      parsedBbox = JSON.parse(selectedField.bbox_json);
    } catch {
      parsedBbox = null;
    }
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header & Document Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#374151] pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#F9FAFB] truncate">
              Evidence Review Workspace
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
              Proof Before Trust
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono truncate">
            {doc.filename} • ID: {doc.id.substring(0, 8)} • SHA-256: {doc.file_hash.substring(0, 16)}...
          </p>
        </div>

        {/* Switch Document Dropdown & Document Status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={doc.id}
            onChange={(e) => setSearchParams({ docId: e.target.value })}
            className="px-2.5 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-[#F9FAFB] text-xs font-medium focus:outline-none focus:border-[#10B981] btn-transition"
          >
            {documents?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename} ({d.status})
              </option>
            ))}
          </select>

          <StatusBadge status={doc.status} />
        </div>
      </div>

      {/* Main Split-Screen Workbench (7 cols Viewer / 5 cols Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Interactive Document Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          {/* Document Viewer Toolbar */}
          <div className="p-2.5 rounded-t-xl bg-[#1F2937] border border-[#374151] border-b-0 flex items-center justify-between text-xs text-[#9CA3AF]">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="font-semibold text-[#F9FAFB]">
                Document Canvas (Page {activePage} of {doc.page_count})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-[#111827] px-1.5 py-0.5 rounded border border-[#374151]">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
                  className="p-1 hover:text-[#F9FAFB]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="font-mono text-[10px] w-8 text-center">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 15, 160))}
                  className="p-1 hover:text-[#F9FAFB]"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1 hover:text-[#F9FAFB] border-l border-[#374151] pl-1.5"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>

              {/* Page navigation */}
              {doc.page_count > 1 && (
                <div className="flex items-center gap-1 bg-[#111827] px-1 py-0.5 rounded border border-[#374151]">
                  <button
                    disabled={activePage <= 1}
                    onClick={() => setActivePage((p) => p - 1)}
                    className="p-0.5 rounded disabled:opacity-40 hover:text-[#F9FAFB]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1 font-mono text-[10px]">{activePage}</span>
                  <button
                    disabled={activePage >= doc.page_count}
                    onClick={() => setActivePage((p) => p + 1)}
                    className="p-0.5 rounded disabled:opacity-40 hover:text-[#F9FAFB]"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <a
                href={`/api/documents/${doc.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-[#10B981] ml-1"
                title="Open original file"
              >
                <span>Raw</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="relative rounded-b-xl border border-[#374151] bg-[#111827] overflow-auto max-h-[640px] flex items-center justify-center p-3">
            <div
              className="relative transition-transform duration-150 origin-top shadow-xl"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              <img
                src={`/api/documents/${doc.id}/preview/${activePage}`}
                alt="Document Page Preview"
                className="w-full max-w-[620px] h-auto object-contain select-none rounded bg-white"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              {/* Bounding Box Visual Overlay */}
              {parsedBbox && selectedField?.page_number === activePage && (
                <div
                  className="absolute pointer-events-none transition-all duration-160 ease-out border-2 border-[#10B981] bg-[#10B981]/15 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
                  style={{
                    left: `${(parsedBbox[0] / 612) * 100}%`,
                    top: `${(parsedBbox[1] / 792) * 100}%`,
                    width: `${((parsedBbox[2] - parsedBbox[0]) / 612) * 100}%`,
                    height: `${((parsedBbox[3] - parsedBbox[1]) / 792) * 100}%`,
                  }}
                >
                  <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-[#10B981] text-black font-mono text-[9px] font-bold shadow-md whitespace-nowrap">
                    {selectedField.field_name}: {selectedField.normalized_value}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Evidence Snippet Bar */}
          <div className="p-3 rounded-lg bg-[#1F2937] border border-[#374151] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#9CA3AF]">
                  Source Evidence
                </span>
                <span className="font-bold text-[#10B981]">
                  {selectedField?.field_name || 'Select a field on the right'}
                </span>
                {parsedBbox ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono">
                    Bounding Box Linked
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#374151] text-[#9CA3AF] font-mono">
                    Context Inferred
                  </span>
                )}
              </div>
              <p className="text-[#F9FAFB] font-mono text-[11px] truncate">
                "{selectedField?.original_text || 'No verbatim source snippet available'}"
              </p>
            </div>

            <span className="text-[10px] text-[#6B7280] font-mono self-end sm:self-center">
              Page {selectedField?.page_number || 1}
            </span>
          </div>
        </div>

        {/* Right: Extracted Fields & Verification Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Human Review Confirmation Gate */}
          <div className="p-3.5 rounded-xl border border-[#374151] bg-[#1F2937] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F9FAFB] uppercase tracking-wider">
                Human Verification Gate
              </span>
              <StatusBadge status={fin?.status || 'Needs review'} size="sm" />
            </div>

            {isConfirmed ? (
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="font-bold">Confirmed as Financial Fact</p>
                  <p className="text-[11px] text-[#10B981]/80 mt-0.5">
                    Confirmed by {fin?.confirmed_by} • Ready for CSV export
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[#9CA3AF] leading-snug">
                  Inspect source evidence on the canvas. Correct any misread values. Confirming promotes this document to a verified financial record.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                    placeholder="Reviewer Name"
                  />

                  {fin && (
                    <button
                      type="button"
                      disabled={confirmMutation.isPending}
                      onClick={() => confirmMutation.mutate(fin.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold flex items-center gap-1.5 btn-transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Record
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Arithmetic Verification Card */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              hasMathMismatch
                ? 'bg-[#F87171]/10 border-[#F87171]/40'
                : 'bg-[#1F2937] border-[#374151]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F9FAFB]">
                <Calculator className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Deterministic Arithmetic Check</span>
              </div>
              {hasMathMismatch ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30">
                  Mismatch Detected
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  Math Verified
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1.5 bg-[#111827] rounded-lg border border-[#374151]">
              <div className="p-1">
                <div className="text-[10px] text-[#9CA3AF] font-sans">Subtotal</div>
                <div className="font-bold text-[#F9FAFB] tabular-nums">{formatCents(subtotalCents)}</div>
              </div>
              <div className="p-1 border-x border-[#374151]">
                <div className="text-[10px] text-[#9CA3AF] font-sans">+ Tax</div>
                <div className="font-bold text-[#F9FAFB] tabular-nums">{formatCents(taxCents)}</div>
              </div>
              <div className="p-1">
                <div className="text-[10px] text-[#9CA3AF] font-sans">= Total</div>
                <div
                  className={`font-bold tabular-nums ${
                    hasMathMismatch ? 'text-[#F87171]' : 'text-[#10B981]'
                  }`}
                >
                  {formatCents(totalCents)}
                </div>
              </div>
            </div>

            {hasMathMismatch && (
              <p className="text-[11px] text-[#F87171] mt-2 leading-tight">
                Calculated {formatCents(mathExpected)} vs printed {formatCents(totalCents)} (Discrepancy: {formatCents(Math.abs(totalCents - mathExpected))}). Please inspect line items.
              </p>
            )}
          </div>

          {/* Extracted Fields List with Tier Badges */}
          <div className="rounded-xl border border-[#374151] bg-[#1F2937] overflow-hidden">
            <div className="p-3 border-b border-[#374151] flex items-center justify-between">
              <span className="text-xs font-bold text-[#F9FAFB] uppercase tracking-wider">
                Extracted Fields ({doc.extracted_fields?.length ?? 0})
              </span>
              <span className="text-[10px] text-[#9CA3AF]">Click field to locate evidence</span>
            </div>

            <div className="divide-y divide-[#374151] max-h-[420px] overflow-y-auto">
              {doc.extracted_fields?.map((field) => {
                const isSelected = selectedField?.id === field.id;
                const isEditing = editingFieldId === field.id;
                const displayVal = field.user_corrected_value || field.normalized_value || '—';

                // Verification Tier: human_confirmed, validated, or ai_extracted
                const tier = field.is_corrected
                  ? 'human_confirmed'
                  : field.validation_status === 'valid'
                  ? 'validated'
                  : 'ai_extracted';

                return (
                  <div
                    key={field.id}
                    onClick={() => {
                      setSelectedField(field);
                      setActivePage(field.page_number || 1);
                    }}
                    className={`p-3 btn-transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#10B981]/10 border-l-2 border-[#10B981]'
                        : 'hover:bg-[#283548]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#F9FAFB] capitalize">
                          {field.field_name.replace(/_/g, ' ')}
                        </span>
                        <VerificationTierBadge tier={tier} />
                      </div>

                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFieldId(null);
                            }}
                            className="p-1 rounded text-[#9CA3AF] hover:text-[#F9FAFB]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFieldId(field.id);
                              setEditValue(field.user_corrected_value || field.normalized_value || '');
                              setEditNote('');
                            }}
                            className="p-1 rounded text-[#9CA3AF] hover:text-[#10B981] btn-transition"
                            title="Edit this field"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#111827] border border-[#10B981] text-xs text-[#F9FAFB] font-mono focus:outline-none"
                          placeholder="Corrected value"
                        />
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="w-full px-2.5 py-1 rounded-lg bg-[#111827] border border-[#374151] text-[11px] text-[#9CA3AF] focus:outline-none"
                          placeholder="Audit note (e.g. verified on page 1)"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateFieldMutation.mutate({
                              fieldId: field.id,
                              value: editValue,
                              note: editNote,
                            })
                          }
                          disabled={updateFieldMutation.isPending}
                          className="w-full py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold flex items-center justify-center gap-1.5 btn-transition"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save Correction
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-xs font-mono font-bold text-[#F9FAFB] truncate max-w-[220px] tabular-nums">
                          {displayVal}
                        </span>
                        <span className="text-[10px] text-[#6B7280] font-mono">
                          {field.extraction_method}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
