import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
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
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { formatCents } from '../components/common/StatusBadge';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const { data: stats, isLoading } = useQuery({
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

  return (
    <div className="space-y-6 pb-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#374151] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F9FAFB]">
            Financial Operations Dashboard
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Real-time status of ingested invoices, verification queues, and deterministic audits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold btn-transition disabled:opacity-50"
          >
            {seeding ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Seed Synthetic Demo Invoices
          </button>
          <Link
            to="/intake"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#283548] text-[#F9FAFB] text-xs font-semibold border border-[#374151] btn-transition"
          >
            <Upload className="w-3.5 h-3.5 text-[#9CA3AF]" />
            Upload Document
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#1F2937] border border-[#374151] finance-card-hover space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#9CA3AF]">{kpi.label}</span>
                <div className="p-1.5 rounded-md bg-[#111827] border border-[#374151] text-[#9CA3AF]">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#F9FAFB] font-mono tabular-nums">
                  {kpi.value}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${kpi.badgeColor}`}>
                  {kpi.badge}
                </span>
              </div>

              <p className="text-[11px] text-[#6B7280]">{kpi.description}</p>
            </div>
          );
        })}
      </div>

      {/* Financial Health Summary & Spend Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend Metrics Card */}
        <div className="p-5 rounded-xl bg-[#1F2937] border border-[#374151] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#10B981]" />
                <h2 className="text-sm font-bold text-[#F9FAFB]">Expense Summary</h2>
              </div>
              <span className="text-[10px] font-mono text-[#9CA3AF]">Database Exact</span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#111827] border border-[#374151]">
                <div className="text-[11px] text-[#9CA3AF]">Total Processed Expenses</div>
                <div className="text-2xl font-bold text-[#F9FAFB] font-mono tabular-nums mt-0.5">
                  {formatCents(stats?.total_spend_cents ?? 0)}
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1">
                  Derived from verified document totals
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/25">
                <div className="text-[11px] text-[#10B981] font-semibold">Human-Confirmed Total</div>
                <div className="text-2xl font-bold text-[#10B981] font-mono tabular-nums mt-0.5">
                  {formatCents(stats?.confirmed_spend_cents ?? 0)}
                </div>
                <p className="text-[10px] text-[#10B981]/70 mt-1">
                  Approved for export and accountant handoff
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/workspace"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 text-xs font-bold btn-transition"
          >
            <span>Review Evidence Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Top Vendors by Spend */}
        <div className="p-5 rounded-xl bg-[#1F2937] border border-[#374151] space-y-4">
          <div className="flex items-center justify-between border-b border-[#374151] pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#10B981]" />
              <h2 className="text-sm font-bold text-[#F9FAFB]">Top Vendors by Volume</h2>
            </div>
            <Link to="/vendors" className="text-xs text-[#10B981] hover:underline">
              View all
            </Link>
          </div>

          {stats?.recent_vendors && stats.recent_vendors.length > 0 ? (
            <div className="space-y-2.5">
              {stats.recent_vendors.map((vendor, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#111827] border border-[#374151] hover:border-[#4B5563] btn-transition"
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

        {/* Monthly Timeline Ledger */}
        <div className="p-5 rounded-xl bg-[#1F2937] border border-[#374151] space-y-4">
          <div className="flex items-center justify-between border-b border-[#374151] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#10B981]" />
              <h2 className="text-sm font-bold text-[#F9FAFB]">Monthly Expense Register</h2>
            </div>
            <span className="text-xs text-[#9CA3AF] font-mono">By Invoice Date</span>
          </div>

          {stats?.monthly_breakdown && stats.monthly_breakdown.length > 0 ? (
            <div className="space-y-2.5">
              {stats.monthly_breakdown.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#111827] border border-[#374151]"
                >
                  <div className="text-xs font-mono font-semibold text-[#F9FAFB]">
                    {m.month}
                  </div>
                  <div className="text-xs font-mono font-bold text-[#10B981] tabular-nums">
                    {formatCents(m.total_spend_cents)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-[#6B7280] text-xs">
              No historical months available yet.
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#111827] hover:bg-[#283548] text-[#F9FAFB] text-xs font-semibold border border-[#374151] btn-transition"
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
