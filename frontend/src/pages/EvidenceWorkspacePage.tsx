import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Save,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calculator,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api, ExtractedFieldItem, FinancialRecordItem } from '../api/client';
import { StatusBadge, formatCents } from '../components/common/StatusBadge';

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
  const { data: doc, isLoading, refetch } = useQuery({
    queryKey: ['documentDetail', selectedDocId],
    queryFn: () => (selectedDocId ? api.getDocument(selectedDocId) : null),
    enabled: !!selectedDocId,
  });

  const [activePage, setActivePage] = useState(1);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading document evidence workspace...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>No document found. Please upload a document in Intake or load demo invoices.</p>
        <Link to="/intake" className="text-indigo-400 hover:underline mt-2 inline-block">
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
    <div className="space-y-6 pb-12">
      {/* Top Header & Document Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              Evidence Workspace
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              Proof Before Trust
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Document ID: <span className="font-mono">{doc.id}</span> • Hash:{' '}
            <span className="font-mono">{doc.file_hash.substring(0, 16)}...</span>
          </p>
        </div>

        {/* Switch Document Dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={doc.id}
            onChange={(e) => setSearchParams({ docId: e.target.value })}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
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

      {/* Main Split-Screen Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Document Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Source Document (Page {activePage} of {doc.page_count})
            </span>

            {doc.page_count > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={activePage <= 1}
                  onClick={() => setActivePage((p) => p - 1)}
                  className="p-1 rounded bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 font-mono text-[11px]">{activePage}</span>
                <button
                  disabled={activePage >= doc.page_count}
                  onClick={() => setActivePage((p) => p + 1)}
                  className="p-1 rounded bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive Document Image Container */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-2 overflow-hidden shadow-2xl">
            <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center min-h-[500px]">
              <img
                src={`/api/documents/${doc.id}/preview/${activePage}`}
                alt="Document Preview"
                className="w-full h-auto object-contain select-none"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              {/* Bounding Box Overlay Marker */}
              {parsedBbox && selectedField?.page_number === activePage && (
                <div
                  className="absolute pointer-events-none transition-all duration-300 border-2 border-indigo-400 bg-indigo-500/20 rounded shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-pulse"
                  style={{
                    // PDF coordinates are typically 0..612 x 0..792 points. We compute percentage mapping.
                    left: `${(parsedBbox[0] / 612) * 100}%`,
                    top: `${(parsedBbox[1] / 792) * 100}%`,
                    width: `${((parsedBbox[2] - parsedBbox[0]) / 612) * 100}%`,
                    height: `${((parsedBbox[3] - parsedBbox[1]) / 792) * 100}%`,
                  }}
                >
                  <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px] font-bold shadow whitespace-nowrap">
                    {selectedField.field_name}: {selectedField.normalized_value}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Evidence Snippet Bar */}
            <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Target Evidence
                  </span>
                  <span className="font-bold text-indigo-400">
                    {selectedField?.field_name || 'Select a field on the right'}
                  </span>
                  {parsedBbox ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                      Coordinates Verified
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      Context Inferred (No Direct Box)
                    </span>
                  )}
                </div>
                <p className="text-slate-300 font-mono text-[11px] truncate">
                  "{selectedField?.original_text || 'No text snippet available'}"
                </p>
              </div>

              <a
                href={`/api/documents/${doc.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-400 flex-shrink-0"
              >
                <span>Raw File</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Right: Extracted Fields & Verification Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Arithmetic Verification Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              hasMathMismatch
                ? 'bg-rose-950/30 border-rose-500/40'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span>Deterministic Arithmetic Check</span>
              </div>
              {hasMathMismatch ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Mismatch Detected
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Math Consistent
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1 bg-slate-950/60 rounded-lg border border-slate-800/80">
              <div className="p-1">
                <div className="text-[10px] text-slate-400 font-sans">Subtotal</div>
                <div className="font-bold text-slate-200">{formatCents(subtotalCents)}</div>
              </div>
              <div className="p-1 border-x border-slate-800">
                <div className="text-[10px] text-slate-400 font-sans">+ Tax</div>
                <div className="font-bold text-slate-200">{formatCents(taxCents)}</div>
              </div>
              <div className="p-1">
                <div className="text-[10px] text-slate-400 font-sans">= Total</div>
                <div
                  className={`font-bold ${
                    hasMathMismatch ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatCents(totalCents)}
                </div>
              </div>
            </div>

            {hasMathMismatch && (
              <p className="text-[11px] text-rose-300 mt-2 leading-tight">
                Calculated {formatCents(mathExpected)} vs printed {formatCents(totalCents)} (Diff:{' '}
                {formatCents(Math.abs(totalCents - mathExpected))}). Please verify line items.
              </p>
            )}
          </div>

          {/* Extracted Fields List with Proof Before Trust Linking */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Extracted Fields ({doc.extracted_fields?.length ?? 0})
              </span>
              <span className="text-[10px] text-slate-400 font-sans">
                Click field to locate evidence
              </span>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[460px] overflow-y-auto">
              {doc.extracted_fields?.map((field) => {
                const isSelected = selectedField?.id === field.id;
                const isEditing = editingFieldId === field.id;
                const displayVal = field.user_corrected_value || field.normalized_value || '—';

                return (
                  <div
                    key={field.id}
                    onClick={() => {
                      setSelectedField(field);
                      setActivePage(field.page_number || 1);
                    }}
                    className={`p-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/15 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 capitalize">
                          {field.field_name.replace(/_/g, ' ')}
                        </span>
                        {field.is_corrected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                            Corrected
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFieldId(null);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-200"
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
                            className="p-1 rounded text-slate-500 hover:text-indigo-400 transition-colors"
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
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-indigo-500/50 text-xs text-white font-mono focus:outline-none"
                          placeholder="Corrected value"
                        />
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-300 focus:outline-none"
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
                          className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save Correction
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-xs font-mono font-semibold text-white truncate max-w-[240px]">
                          {displayVal}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {field.extraction_method}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Human Confirmation Section */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Human Review Gate
              </span>
              <StatusBadge status={fin?.status || 'Needs review'} size="sm" />
            </div>

            {isConfirmed ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold">Confirmed as Verified Financial Record</p>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">
                    Confirmed by {fin?.confirmed_by} • Ready for CSV Bookkeeping Export
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 leading-snug">
                  Inspect the source document on the left. Correct any misread values above.
                  Confirming establishes this document as verified for bookkeeping.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    placeholder="Reviewer Name"
                  />

                  {fin && (
                    <button
                      type="button"
                      disabled={confirmMutation.isPending}
                      onClick={() => confirmMutation.mutate(fin.id)}
                      className="w-1/2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Record
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
