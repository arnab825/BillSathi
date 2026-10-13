import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Download,
  Search,
  Eye,
  FileText,
  Sparkles,
  Brain,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { api, AiExecutiveBriefing } from '../api/client';
import { StatusBadge, formatCents } from '../components/common/StatusBadge';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { useToast } from '../context/ToastContext';
import { useCurrency, CURRENCY_SYMBOLS } from '../context/CurrencyContext';

export const RegisterPage: React.FC = () => {
  const toast = useToast();
  const { homeCurrency, formatHome, getConversion } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [aiBriefing, setAiBriefing] = useState<AiExecutiveBriefing | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  const { data: records, isLoading } = useQuery({
    queryKey: ['financialRecords', statusFilter, categoryFilter, searchTerm],
    queryFn: () =>
      api.listRecords({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchTerm || undefined,
      }),
  });

  const categories = [
    'all',
    'Software',
    'Cloud Hosting',
    'Travel & Lodging',
    'Equipment',
    'Office Supplies',
    'Professional Services',
    'Other',
  ];

  const handleExportCsv = (statusOnly?: string) => {
    toast.success('Exporting RFC 4180 Register', `Preparing ${statusOnly || 'all'} financial records for download`);
    const url = api.getExportCsvUrl(statusOnly);
    window.location.href = url;
  };

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#374151] pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F9FAFB] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#10B981]" />
              Financial Expense Register
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
              Ledger: {homeCurrency} ({CURRENCY_SYMBOLS[homeCurrency] || homeCurrency})
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Verified monthly expense register prepared for accountant handoff and tax audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                setLoadingBriefing(true);
                const briefing = await api.getAiBriefing(statusFilter !== 'all' ? statusFilter : undefined);
                setAiBriefing(briefing);
                setShowBriefing(true);
                toast.success('AI Briefing Generated', `Synthesized audit summary for ${briefing.total_records} records`);
              } catch {
                toast.error('Briefing Failed', 'Could not generate executive briefing');
              } finally {
                setLoadingBriefing(false);
              }
            }}
            disabled={loadingBriefing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#374151] hover:bg-[#4B5563] text-[#F9FAFB] text-xs font-semibold border border-[#4B5563] btn-transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loadingBriefing ? (
              <RefreshCw className="w-4 h-4 text-[#10B981] animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#10B981]" />
            )}
            <span>{loadingBriefing ? 'Synthesizing...' : 'AI Executive Briefing'}</span>
          </button>

          <button
            onClick={() => handleExportCsv('Confirmed')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold btn-transition"
          >
            <Download className="w-4 h-4" />
            Export Confirmed CSV (Audit-Ready)
          </button>
          <button
            onClick={() => handleExportCsv('all')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#283548] text-[#F9FAFB] text-xs font-semibold border border-[#374151] btn-transition"
          >
            <Download className="w-4 h-4 text-[#9CA3AF]" />
            Export All Records
          </button>
        </div>
      </div>

      {/* AI Executive Briefing Banner */}
      {aiBriefing && showBriefing && (
        <div className="p-4 rounded-xl bg-[#111827] border border-[#10B981]/30 space-y-3 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center justify-between border-b border-[#374151] pb-2.5">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#10B981]" />
              <h2 className="text-xs font-bold text-[#F9FAFB] uppercase tracking-wider">
                {aiBriefing.title}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                {aiBriefing.total_spend_formatted}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#9CA3AF] font-mono">{aiBriefing.generated_at}</span>
              <button
                type="button"
                onClick={() => setShowBriefing(false)}
                className="text-xs text-[#9CA3AF] hover:text-[#F9FAFB] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-[#D1D5DB]">
            {aiBriefing.bullets.map((b, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-[#1F2937] border border-[#374151]/70 flex items-start gap-2">
                <span className="text-[#10B981] font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="p-3.5 rounded-xl border border-[#374151] bg-[#1F2937] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendor, invoice #, description..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <CustomDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            size="sm"
            className="w-48"
            options={[
              { value: 'all', label: 'All Review States' },
              { value: 'Confirmed', label: 'Confirmed (Audit-Ready)', badge: 'Verified' },
              { value: 'Reviewed', label: 'Reviewed' },
              { value: 'Needs review', label: 'Needs Review', badge: 'Action' },
            ]}
          />

          <CustomDropdown
            value={categoryFilter}
            onChange={setCategoryFilter}
            size="sm"
            className="w-48"
            options={categories.map((c) => ({
              value: c,
              label: c === 'all' ? 'All Categories' : c,
            }))}
          />
        </div>
      </div>

      {/* Clean Compact Data Table */}
      <div className="rounded-xl border border-[#374151] bg-[#1F2937] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111827] border-b border-[#374151] text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold">
              <tr>
                <th className="px-4 py-3">Invoice Date</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">Tax</th>
                <th className="px-4 py-3 text-right">Total Due</th>
                <th className="px-4 py-3 text-right">Home ({homeCurrency})</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#9CA3AF]">
                    Loading financial ledger records...
                  </td>
                </tr>
              ) : records && records.length > 0 ? (
                records.map((r) => {
                  const conv = getConversion(r.total_cents, r.currency);
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-[#283548] btn-transition group"
                    >
                      <td className="px-4 py-3 font-mono text-[#F9FAFB] tabular-nums whitespace-nowrap">
                        {r.invoice_date || '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#F9FAFB] whitespace-nowrap">
                        {r.vendor_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#9CA3AF] tabular-nums whitespace-nowrap">
                        {r.invoice_number || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-[#111827] border border-[#374151] text-[#9CA3AF] text-[10px]">
                          {r.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#9CA3AF] tabular-nums whitespace-nowrap">
                        {formatCents(r.subtotal_cents, r.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#9CA3AF] tabular-nums whitespace-nowrap">
                        {formatCents(r.tax_cents, r.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#F9FAFB] tabular-nums whitespace-nowrap">
                        {formatCents(r.total_cents, r.currency)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {conv.isDifferent ? (
                          <div>
                            <div className="font-mono font-bold text-[#10B981] tabular-nums">
                              {conv.convertedFormatted}
                            </div>
                            <div className="text-[9px] text-[#6B7280] font-mono mt-0.5">
                              {conv.rateText}
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-[#9CA3AF] tabular-nums">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          to={`/workspace?docId=${r.document_id}`}
                          className="inline-flex items-center gap-1 text-[#10B981] hover:underline font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-[#6B7280]">
                    No financial records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
