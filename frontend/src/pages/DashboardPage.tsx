import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Copy,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Upload,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge, formatCents } from '../components/common/StatusBadge';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: api.getDashboard,
    refetchInterval: 5000,
  });

  const seedMutation = useMutation({
    mutationFn: api.seedDemo,
    onMutate: () => setSeeding(true),
    onSettled: () => {
      setSeeding(false);
      queryClient.invalidateQueries();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading verified financial metrics...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Processed',
      value: stats?.total_documents ?? 0,
      icon: FileText,
      color: 'from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30',
      description: 'Documents in system',
    },
    {
      label: 'Needs Human Review',
      value: stats?.needs_review_count ?? 0,
      icon: AlertTriangle,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      description: 'Pending evidence verification',
      urgent: (stats?.needs_review_count ?? 0) > 0,
    },
    {
      label: 'Human Confirmed',
      value: stats?.confirmed_count ?? 0,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      description: 'Audit-ready for bookkeeping',
    },
    {
      label: 'Unresolved Anomalies',
      value: stats?.unresolved_anomalies ?? 0,
      icon: ShieldAlert,
      color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
      description: 'Arithmetic / duplicate alerts',
      urgent: (stats?.unresolved_anomalies ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner with Proof Before Trust Philosophy */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Proof Before Trust Financial Intelligence
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Financial documents you can verify, not just extract.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every invoice value links to verified spatial coordinates in the source document.
              Arithmetic errors and duplicates are flagged deterministically by rules—never guessed by AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {seeding ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Load Hackathon Demo (3 Invoices)
            </button>
            <Link
              to="/intake"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-xl border bg-gradient-to-b bg-slate-900/60 backdrop-blur-sm transition-all hover:scale-[1.01] ${kpi.color}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {kpi.label}
                </span>
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                  {kpi.value}
                </span>
                {kpi.urgent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Action Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">{kpi.description}</p>
            </div>
          );
        })}
      </div>

      {/* Financial Health Summary & Spend Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend Metrics */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Spend Summary</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">Database Exact</span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <div className="text-xs text-slate-400">Total Recorded Expenses</div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {formatCents(stats?.total_spend_cents ?? 0)}
              </div>
              <p className="text-[11px] text-slate-500">
                Sum of all processed document line totals
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <div className="text-xs text-emerald-400 font-medium">Human-Confirmed Spend</div>
              <div className="text-2xl font-extrabold text-emerald-300 font-mono">
                {formatCents(stats?.confirmed_spend_cents ?? 0)}
              </div>
              <p className="text-[11px] text-emerald-500/80">
                Cleared by human reviewer for tax handoff
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/workspace"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-colors"
            >
              Open Evidence Review Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Top Vendors by Spend */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              <h2 className="text-base font-bold text-white">Top Vendors</h2>
            </div>
            <Link to="/vendors" className="text-xs text-indigo-400 hover:underline">
              View all
            </Link>
          </div>

          {stats?.recent_vendors && stats.recent_vendors.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_vendors.map((vendor, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-bold text-slate-200 truncate">
                      {vendor.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{vendor.category}</span>
                      <span>•</span>
                      <span>{vendor.invoice_count} invoices</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold font-mono text-slate-100">
                      {formatCents(vendor.total_spend_cents)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      avg {formatCents(vendor.average_amount_cents)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No vendor records yet. Upload an invoice or click Load Hackathon Demo above.
            </div>
          )}
        </div>

        {/* Monthly Timeline Breakdown */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Monthly Timeline</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">By Invoice Date</span>
          </div>

          {stats?.monthly_breakdown && stats.monthly_breakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.monthly_breakdown.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60"
                >
                  <div className="text-xs font-mono font-semibold text-slate-300">
                    {m.month}
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-300">
                    {formatCents(m.total_spend_cents)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No historical months available yet.
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Export Monthly Register (CSV)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
