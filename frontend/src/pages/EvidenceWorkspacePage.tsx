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
import { CustomDropdown } from '../components/common/CustomDropdown';
import { useToast } from '../context/ToastContext';

export const EvidenceWorkspacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

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

  // Fetch active user account profile
  const { data: account } = useQuery({
    queryKey: ['userAccountProfile'],
    queryFn: api.getAccount,
  });

  const [activePage, setActivePage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mobileTab, setMobileTab] = useState<'both' | 'viewer' | 'fields'>('both');
  const [selectedField, setSelectedField] = useState<ExtractedFieldItem | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editNote, setEditNote] = useState('');
  const [reviewerName, setReviewerName] = useState('Alex Rivera');

  // Sync reviewer name with account profile once loaded
  useEffect(() => {
    if (account?.full_name) {
      setReviewerName(account.full_name);
    }
  }, [account?.full_name]);

  // When doc changes, select vendor_name or first field with physical evidence
  useEffect(() => {
    if (doc?.extracted_fields && doc.extracted_fields.length > 0) {
      const vendorField = doc.extracted_fields.find((f) => f.field_name === 'vendor_name');
      const firstBboxField = doc.extracted_fields.find((f) => !!f.bbox_json);
      setSelectedField(vendorField || firstBboxField || doc.extracted_fields[0]);
    }
  }, [doc]);

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: ({ fieldId, value, note }: { fieldId: string; value: string; note: string }) =>
      api.updateField(fieldId, value, note),
    onSuccess: () => {
      setEditingFieldId(null);
      toast.success('Field Corrected', 'Audit trail updated and marked as human-confirmed');
      queryClient.invalidateQueries({ queryKey: ['documentDetail', selectedDocId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: () => {
      toast.error('Correction Failed', 'Unable to save field update');
    },
  });

  // Confirm record mutation
  const confirmMutation = useMutation({
    mutationFn: (recId: string) => api.confirmRecord(recId, reviewerName),
    onSuccess: () => {
      toast.success('Record Confirmed', `Promoted to financial ledger by ${reviewerName}`);
      queryClient.invalidateQueries({ queryKey: ['documentDetail', selectedDocId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['documentsList'] });
    },
    onError: () => {
      toast.error('Confirmation Failed', 'Unable to promote document to verified ledger');
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

  const totalField = doc.extracted_fields?.find((f) => f.field_name.toLowerCase() === 'total');
  const subtotalField = doc.extracted_fields?.find((f) => f.field_name.toLowerCase() === 'subtotal');
  const taxField = doc.extracted_fields?.find((f) => f.field_name.toLowerCase() === 'tax');

  const parseToCents = (valStr?: string | null, fallbackCents = 0): number => {
    if (!valStr) return fallbackCents;
    const clean = valStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? fallbackCents : Math.round(num * 100);
  };

  // Compute active/effective values prioritizing user corrections
  const effectiveSubtotalCents = subtotalField?.user_corrected_value
    ? parseToCents(subtotalField.user_corrected_value, fin?.subtotal_cents ?? 0)
    : fin?.subtotal_cents ?? 0;

  const effectiveTaxCents = taxField?.user_corrected_value
    ? parseToCents(taxField.user_corrected_value, fin?.tax_cents ?? 0)
    : fin?.tax_cents ?? 0;

  const effectiveTotalCents = totalField?.user_corrected_value
    ? parseToCents(totalField.user_corrected_value, fin?.total_cents ?? 0)
    : fin?.total_cents ?? 0;

  const mathExpected = effectiveSubtotalCents + effectiveTaxCents;
  const hasMathMismatch = effectiveSubtotalCents > 0 && effectiveTotalCents > 0 && mathExpected !== effectiveTotalCents;

  // Structured Line Items Parser (Segment 1)
  const lineItems = React.useMemo(() => {
    if (!doc.raw_text) return [];
    const items: { description: string; qty: string; amount: string; amountCents: number }[] = [];
    const match = doc.raw_text.match(/DESCRIPTION[\s\S]*?AMOUNT([\s\S]*?)(?:SUBTOTAL|TOTAL DUE|TAX)/i);
    if (match && match[1]) {
      const rawLines = match[1].split('\n').map((l) => l.trim()).filter(Boolean);
      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        const inlineMatch = line.match(/^(.+?)\s+(\d+)\s+\$?([0-9,]+\.[0-9]{2})$/);
        if (inlineMatch) {
          const amtClean = inlineMatch[3].replace(/,/g, '');
          items.push({
            description: inlineMatch[1].trim(),
            qty: inlineMatch[2],
            amount: `$${inlineMatch[3]}`,
            amountCents: Math.round(parseFloat(amtClean) * 100),
          });
          continue;
        }
        if (i + 2 < rawLines.length) {
          const nextLine = rawLines[i + 1];
          const amountLine = rawLines[i + 2];
          const isQty = /^\d+$/.test(nextLine);
          const isAmt = /^\$?[0-9,]+\.[0-9]{2}$/.test(amountLine);
          if (isQty && isAmt) {
            const amtClean = amountLine.replace(/[\$,]/g, '');
            items.push({
              description: line,
              qty: nextLine,
              amount: amountLine.startsWith('$') ? amountLine : `$${amountLine}`,
              amountCents: Math.round(parseFloat(amtClean) * 100),
            });
            i += 2;
          }
        }
      }
    }
    return items;
  }, [doc.raw_text]);

  const lineItemsSumCents = lineItems.reduce((acc, it) => acc + it.amountCents, 0);
  const itemsMatchSubtotal = lineItems.length > 0 && lineItemsSumCents === effectiveSubtotalCents;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#374151] pb-3 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#F9FAFB] truncate">
              Evidence Review Workspace
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 whitespace-nowrap flex-shrink-0">
              Proof Before Trust
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono truncate">
            {doc.filename} • ID: {doc.id.substring(0, 8)} • SHA-256: {doc.file_hash.substring(0, 16)}...
          </p>
        </div>

        {/* Switch Document Interactive Dropdown & Document Status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <CustomDropdown
            value={doc.id}
            onChange={(newId) => setSearchParams({ docId: newId })}
            size="sm"
            className="w-48 sm:w-60"
            options={
              documents?.map((d) => ({
                value: d.id,
                label: d.filename,
                description: `${d.financial_record?.vendor_name || 'Processing'} • ${formatCents(d.financial_record?.total_cents || 0)}`,
                badge: d.status,
              })) || []
            }
          />

        </div>
      </div>

      {/* Mobile Responsive Segmented Tab Switcher */}
      <div className="flex lg:hidden items-center justify-between p-1 rounded-xl bg-[#1F2937] border border-[#374151] gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('both')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg btn-transition ${
            mobileTab === 'both' ? 'bg-[#10B981] text-black font-bold shadow-sm' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
          }`}
        >
          Split View
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('viewer')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg btn-transition ${
            mobileTab === 'viewer' ? 'bg-[#10B981] text-black font-bold shadow-sm' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
          }`}
        >
          Canvas
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('fields')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg btn-transition ${
            mobileTab === 'fields' ? 'bg-[#10B981] text-black font-bold shadow-sm' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
          }`}
        >
          Extracted Fields ({doc.extracted_fields?.length || 0})
        </button>
      </div>

      {/* Main Split-Screen Workbench (7 cols Viewer / 5 cols Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start min-w-0 w-full">
        {/* Left: Interactive Document Viewer (7 cols) */}
        <div className={`lg:col-span-7 min-w-0 w-full space-y-2 ${mobileTab === 'fields' ? 'hidden lg:block' : 'block'}`}>
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

          {/* Canvas Viewport with Realistic Document Framing */}
          <div className="relative rounded-b-xl border border-[#374151] bg-[#090d16] overflow-auto min-h-[540px] max-h-[calc(100vh-210px)] flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
            <div
              className="relative transition-transform duration-150 origin-top shadow-[0_25px_60px_-12px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.15)] rounded-sm bg-white p-[1px] ring-1 ring-slate-600/60 my-auto"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              <img
                src={`/api/documents/${doc.id}/preview/${activePage}`}
                alt="Document Page Preview"
                className="w-full max-w-[650px] lg:max-w-[720px] h-auto object-contain select-none block rounded-[2px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              {/* Bounding Box Visual Overlay */}
              {parsedBbox && selectedField?.page_number === activePage && (() => {
                const leftPct = (parsedBbox[0] / 612) * 100;
                const topPct = (parsedBbox[1] / 792) * 100;
                const widthPct = ((parsedBbox[2] - parsedBbox[0]) / 612) * 100;
                const heightPct = ((parsedBbox[3] - parsedBbox[1]) / 792) * 100;
                const isNearTop = topPct < 8;

                return (
                  <div
                    className="absolute pointer-events-none transition-all duration-160 ease-out border-2 border-[#10B981] bg-[#10B981]/15 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.6),0_0_15px_rgba(16,185,129,0.35)]"
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                    }}
                  >
                    <div
                      className={`absolute left-0 px-2 py-0.5 rounded bg-[#10B981] text-black font-mono text-[9px] font-bold shadow-lg whitespace-nowrap z-20 ${
                        isNearTop ? 'top-full mt-1.5' : '-top-5'
                      }`}
                    >
                      {selectedField.field_name}: {selectedField.normalized_value}
                    </div>
                  </div>
                );
              })()}
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
        <div className={`lg:col-span-5 min-w-0 w-full space-y-3.5 ${mobileTab === 'viewer' ? 'hidden lg:block' : 'block'}`}>
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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                      placeholder="Reviewer Name"
                    />
                    {account && (
                      <span className="absolute right-2 top-1.5 text-[9px] font-mono text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/20 hidden sm:inline-block">
                        {account.business_name}
                      </span>
                    )}
                  </div>

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

          {/* Multi-Segment Deterministic Arithmetic Check */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              hasMathMismatch
                ? 'bg-[#F87171]/10 border-[#F87171]/40'
                : 'bg-[#1F2937] border-[#374151]'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F9FAFB]">
                <Calculator className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Deterministic Arithmetic Check (Multi-Segment)</span>
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

            {/* Segment 1: Line Items Breakdown */}
            {lineItems.length > 0 && (
              <div className="mb-2.5 p-2 rounded-lg bg-[#111827] border border-[#374151] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#9CA3AF]">
                  <span>Segment 1: Line Items ({lineItems.length})</span>
                  <span className="font-mono text-[#F9FAFB]">Sum: {formatCents(lineItemsSumCents)}</span>
                </div>
                <div className="divide-y divide-[#374151]/50 text-[11px] font-mono">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="py-1 flex items-center justify-between text-[#E5E7EB]">
                      <span className="truncate pr-2 font-sans text-xs">{item.description}</span>
                      <span className="text-[#9CA3AF] text-[10px] pr-2">×{item.qty}</span>
                      <span className="tabular-nums font-bold text-[#10B981]">{item.amount}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-1 border-t border-[#374151]/60 flex items-center justify-between text-[10px]">
                  <span className="text-[#9CA3AF]">Items Sum vs Subtotal:</span>
                  {itemsMatchSubtotal ? (
                    <span className="text-[#10B981] font-bold">✓ Matches Subtotal ({formatCents(effectiveSubtotalCents)})</span>
                  ) : (
                    <span className="text-[#F87171] font-bold">≠ Discrepancy ({formatCents(Math.abs(lineItemsSumCents - effectiveSubtotalCents))})</span>
                  )}
                </div>
              </div>
            )}

            {/* Segment 2 & 3: Totals & Tax Arithmetic Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1.5 bg-[#111827] rounded-lg border border-[#374151]">
              <div className="p-1">
                <div className="text-[10px] text-[#9CA3AF] font-sans">Subtotal</div>
                <div className="font-bold text-[#F9FAFB] tabular-nums">{formatCents(effectiveSubtotalCents)}</div>
              </div>
              <div className="p-1 border-x border-[#374151]">
                <div className="text-[10px] text-[#9CA3AF] font-sans">+ Tax</div>
                <div className="font-bold text-[#F9FAFB] tabular-nums">{formatCents(effectiveTaxCents)}</div>
              </div>
              <div className="p-1">
                <div className="text-[10px] text-[#9CA3AF] font-sans">= Total</div>
                <div
                  className={`font-bold tabular-nums ${
                    hasMathMismatch ? 'text-[#F87171]' : 'text-[#10B981]'
                  }`}
                >
                  {formatCents(effectiveTotalCents)}
                </div>
              </div>
            </div>

            {hasMathMismatch && (
              <div className="mt-2 space-y-2">
                <p className="text-[11px] text-[#F87171] leading-tight">
                  Calculated {formatCents(mathExpected)} vs printed {formatCents(effectiveTotalCents)} (Discrepancy: {formatCents(Math.abs(effectiveTotalCents - mathExpected))}). Please inspect line items.
                </p>

                {totalField && (
                  <button
                    type="button"
                    onClick={() => {
                      updateFieldMutation.mutate({
                        fieldId: totalField.id,
                        value: (mathExpected / 100).toFixed(2),
                        note: `Auto-balanced Total to match Subtotal (${formatCents(effectiveSubtotalCents)}) + Tax (${formatCents(effectiveTaxCents)})`,
                      });
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Match Total to Math: {formatCents(mathExpected)}</span>
                  </button>
                )}
              </div>
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
