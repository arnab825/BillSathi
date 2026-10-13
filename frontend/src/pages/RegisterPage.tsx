import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Download,
  Search,
  Eye,
  FileText,
} from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge, formatCents } from '../components/common/StatusBadge';

export const RegisterPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
    const url = api.getExportCsvUrl(statusOnly);
    window.location.href = url;
  };

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#374151] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F9FAFB] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#10B981]" />
            Financial Expense Register
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Verified monthly expense register prepared for accountant handoff and tax audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] font-medium focus:outline-none"
          >
            <option value="all">All Review States</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Needs review">Needs Review</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] font-medium focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>
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
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#9CA3AF]">
                    Loading financial ledger records...
                  </td>
                </tr>
              ) : records && records.length > 0 ? (
                records.map((r) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[#6B7280]">
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
