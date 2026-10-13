import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Calendar,
  Building2,
  Tag,
} from 'lucide-react';
import { api, FinancialRecordItem } from '../api/client';
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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-400" />
            Financial Register
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Verified monthly expense register prepared for accountant and tax handoff.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCsv('Confirmed')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Confirmed CSV (Audit-Ready)
          </button>
          <button
            onClick={() => handleExportCsv('all')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Export All Records
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendor, invoice #, desc..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Needs review">Needs Review</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Records */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="px-4 py-3.5">Invoice Date</th>
                <th className="px-4 py-3.5">Vendor</th>
                <th className="px-4 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Subtotal</th>
                <th className="px-4 py-3.5 text-right">Tax</th>
                <th className="px-4 py-3.5 text-right">Total Due</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading records...
                  </td>
                </tr>
              ) : records && records.length > 0 ? (
                records.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                      {r.invoice_date || '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                      {r.vendor_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                      {r.invoice_number || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300 text-[10px]">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400 whitespace-nowrap">
                      {formatCents(r.subtotal_cents, r.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400 whitespace-nowrap">
                      {formatCents(r.tax_cents, r.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white whitespace-nowrap">
                      {formatCents(r.total_cents, r.currency)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/workspace?docId=${r.document_id}`}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Verify
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
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
