import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Receipt,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Upload,
  RefreshCw,
  ShieldAlert,
  Clock,
  PieChart,
  TrendingUp,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { formatCents } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);
  const [timeHorizon, setTimeHorizon] = useState<'all' | 'quarter' | 'month'>('all');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: api.getDashboard,
    refetchInterval: 5000,
  });

  const seedMutation = useMutation({
    mutationFn: api.seedDemo,
    onMutate: () => setSeeding(true),
    onSuccess: (res) => {
      toast.success('Synthetic Demo Invoices Seeded', `Created ${res.documents_created} documents with arithmetic checks and duplicate flags`);
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast.error('Seeding Failed', 'Unable to generate synthetic invoices');
    },
    onSettled: () => setSeeding(false),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-[#10B981] animate-spin" />
          <p className="text-xs text-[#9CA3AF]">Loading financial database records...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Documents',
      value: stats?.total_documents ?? 0,
      icon: FileText,
      description: 'Ingested into ledger',
      badge: 'Processed',
      badgeColor: 'text-[#9CA3AF] bg-[#374151]',
    },
    {
      label: 'Needs Human Review',
      value: stats?.needs_review_count ?? 0,
      icon: Clock,
      description: 'Awaiting human sign-off',
      badge: (stats?.needs_review_count ?? 0) > 0 ? 'Review Required' : 'Up to Date',
      badgeColor:
        (stats?.needs_review_count ?? 0) > 0
          ? 'text-[#F59E0B] bg-[#F59E0B]/15 border border-[#F59E0B]/30'
          : 'text-[#10B981] bg-[#10B981]/15',
    },
    {
      label: 'Confirmed Records',
      value: stats?.confirmed_count ?? 0,
      icon: CheckCircle2,
      description: 'Audit-ready for tax handoff',
      badge: 'Verified',
      badgeColor: 'text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30',
    },
    {
      label: 'Active Anomalies',
      value: stats?.unresolved_anomalies ?? 0,
      icon: ShieldAlert,
      description: 'Math or duplicate flags',
      badge: (stats?.unresolved_anomalies ?? 0) > 0 ? 'Action Needed' : 'Zero Flags',
      badgeColor:
        (stats?.unresolved_anomalies ?? 0) > 0
          ? 'text-[#F87171] bg-[#F87171]/15 border border-[#F87171]/30'
          : 'text-[#10B981] bg-[#10B981]/15',
    },
  ];

  const hasAnomalies = (stats?.unresolved_anomalies ?? 0) > 0;
  const totalSpend = stats?.total_spend_cents ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header: Title, Horizon Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#374151]/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F9FAFB]">
              Financial Operations Dashboard
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
              Live Ledger
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Deterministic financial audits, open-weight AI extractions, and verification queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Interactive Time Horizon Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#111827] border border-[#374151] text-xs">
            {(['all', 'quarter', 'month'] as const).map((period) => {
              const labels = { all: 'All Time', quarter: 'This Quarter', month: 'Last 30 Days' };
              const isActive = timeHorizon === period;
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => setTimeHorizon(period)}
                  className={`px-2.5 py-1 rounded-lg font-medium btn-transition ${
                    isActive
                      ? 'bg-[#1F2937] text-[#10B981] font-bold shadow-sm border border-[#374151]'
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                  }`}
                >
                  {labels[period]}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => seedMutation.mutate()}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold btn-transition disabled:opacity-50 shadow-sm"
          >
            {seeding ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Seed Synthetic Demo
          </button>

          <Link
            to="/intake"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F2937] hover:bg-[#283548] text-[#F9FAFB] text-xs font-semibold border border-[#374151] btn-transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-[#9CA3AF]" />
            Upload Document
          </Link>
        </div>
      </div>

      {/* Active Audit Anomaly Alert Banner (Appears dynamically) */}
      {hasAnomalies && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F87171]/15 via-[#1F2937] to-[#1F2937] border border-[#F87171]/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-0 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F87171]/20 border border-[#F87171]/40 flex items-center justify-center text-[#F87171] flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F9FAFB] flex items-center gap-2">
                <span>{stats?.unresolved_anomalies} Audit Anomalies Detected</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30">
                  Critical Gate
                </span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                Deterministic mathematical discrepancies or duplicates identified. Confirming invoices requires audit sign-off.
              </p>
            </div>
          </div>

          <Link
            to="/anomalies"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F87171] hover:bg-[#ef4444] text-black text-xs font-bold btn-transition flex-shrink-0 shadow-sm"
          >
            <span>Resolve in Anomaly Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#1F2937]/90 border border-[#374151] finance-card-hover space-y-3 backdrop-blur-md shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9CA3AF]">{kpi.label}</span>
                <div className="p-2 rounded-xl bg-[#111827] border border-[#374151] text-[#10B981] shadow-inner">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-extrabold text-[#F9FAFB] font-mono tabular-nums tracking-tight">
                  {kpi.value}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.badgeColor}`}>
                  {kpi.badge}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1 border-t border-[#374151]/50">
                <span>{kpi.description}</span>
                <TrendingUp className="w-3 h-3 text-[#10B981]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Health Summary & Spend Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend Metrics Card */}
        <div className="p-5 rounded-2xl bg-[#1F2937]/90 border border-[#374151] flex flex-col justify-between space-y-4 shadow-lg backdrop-blur-md">
          <div>
            <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#10B981]" />
                <h2 className="text-sm font-bold text-[#F9FAFB]">Expense Summary</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                Database Exact
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#111827] border border-[#374151] shadow-inner">
                <div className="text-[11px] font-medium text-[#9CA3AF]">Total Processed Invoices</div>
                <div className="text-2xl font-extrabold text-[#F9FAFB] font-mono tabular-nums mt-0.5">
                  {formatCents(stats?.total_spend_cents ?? 0)}
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1">
                  Derived from {stats?.total_documents ?? 0} invoices ingested into SQLite ledger
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30">
                <div className="text-[11px] font-semibold text-[#10B981]">Human-Confirmed Total</div>
                <div className="text-2xl font-extrabold text-[#10B981] font-mono tabular-nums mt-0.5">
                  {formatCents(stats?.confirmed_spend_cents ?? 0)}
                </div>
                <p className="text-[10px] text-[#10B981]/70 mt-1">
                  Approved for accountant handoff and tax register export
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/workspace"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 text-xs font-bold btn-transition shadow-sm"
          >
            <span>Review Evidence Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Top Vendors by Spend */}
        <div className="p-5 rounded-2xl bg-[#1F2937]/90 border border-[#374151] space-y-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-[#374151] pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#10B981]" />
              <h2 className="text-sm font-bold text-[#F9FAFB]">Top Vendors by Volume</h2>
            </div>
            <Link to="/vendors" className="text-xs text-[#10B981] hover:underline font-medium">
              View all
            </Link>
          </div>

          {stats?.recent_vendors && stats.recent_vendors.length > 0 ? (
            <div className="space-y-2.5">
              {stats.recent_vendors.map((vendor, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#111827] border border-[#374151] hover:border-[#10B981]/40 btn-transition shadow-sm"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-bold text-[#F9FAFB] truncate">
                      {vendor.name}
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5 mt-0.5">
                      <span>{vendor.category}</span>
                      <span>•</span>
                      <span>{vendor.invoice_count} bills</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold font-mono text-[#F9FAFB] tabular-nums">
                      {formatCents(vendor.total_spend_cents)}
                    </div>
                    <div className="text-[10px] text-[#6B7280]">
                      avg {formatCents(vendor.average_amount_cents)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-[#6B7280] text-xs">
              No vendor records yet. Seed synthetic invoices or upload documents above.
            </div>
          )}
        </div>

        {/* Visual Monthly Expense Distribution & Category Breakdown */}
        <div className="p-5 rounded-2xl bg-[#1F2937]/90 border border-[#374151] space-y-4 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#374151] pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#10B981]" />
                <h2 className="text-sm font-bold text-[#F9FAFB]">Spend Distribution</h2>
              </div>
              <span className="text-xs text-[#9CA3AF] font-mono">Ledger Allocation</span>
            </div>

            {/* Visual Progress Bar Distribution */}
            {stats?.recent_vendors && stats.recent_vendors.length > 0 ? (
              <div className="space-y-4 mt-3">
                <div className="h-3 w-full rounded-full bg-[#111827] overflow-hidden flex shadow-inner">
                  {stats.recent_vendors.map((vendor, i) => {
                    const pct = totalSpend > 0 ? (vendor.total_spend_cents / totalSpend) * 100 : 0;
                    const colors = ['bg-[#10B981]', 'bg-[#38BDF8]', 'bg-[#A855F7]', 'bg-[#F59E0B]'];
                    return (
                      <div
                        key={i}
                        style={{ width: `${pct}%` }}
                        className={`${colors[i % colors.length]} transition-all duration-500 hover:opacity-85`}
                        title={`${vendor.name}: ${pct.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>

                {/* Vendor Legend Breakdown */}
                <div className="space-y-2">
                  {stats.recent_vendors.map((vendor, i) => {
                    const pct = totalSpend > 0 ? (vendor.total_spend_cents / totalSpend) * 100 : 0;
                    const dots = ['bg-[#10B981]', 'bg-[#38BDF8]', 'bg-[#A855F7]', 'bg-[#F59E0B]'];
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#111827] border border-[#374151]/70"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className={`w-2 h-2 rounded-full ${dots[i % dots.length]}`} />
                          <span className="text-[#F9FAFB] font-medium truncate">{vendor.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                          <span className="text-[#9CA3AF] text-[11px]">{pct.toFixed(0)}%</span>
                          <span className="text-[#F9FAFB] font-bold">{formatCents(vendor.total_spend_cents)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#6B7280] text-xs">
                No expense breakdown data available yet.
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              to="/register"
              onClick={() => toast.info('Navigating to Reports', 'View and export full RFC 4180 audit ledger')}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#111827] hover:bg-[#283548] text-[#F9FAFB] text-xs font-semibold border border-[#374151] btn-transition shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-[#9CA3AF]" />
              Export Monthly Report (CSV)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
