import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  TrendingUp,
  Receipt,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { api, VendorProfile, VendorComparison } from '../api/client';
import { formatCents } from '../components/common/StatusBadge';

export const VendorIntelligencePage: React.FC = () => {
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const { data: vendors, isLoading: loadingVendors } = useQuery({
    queryKey: ['vendorsList'],
    queryFn: api.listVendors,
  });

  const activeVendorName = selectedVendor || (vendors && vendors.length > 0 ? vendors[0].name : null);

  const { data: comparison, isLoading: loadingComparison } = useQuery({
    queryKey: ['vendorComparison', activeVendorName],
    queryFn: () => (activeVendorName ? api.getVendorComparison(activeVendorName) : null),
    enabled: !!activeVendorName,
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-violet-400" />
          Vendor Intelligence & Spending Trends
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical invoice tracking, average cost calculations, and explainable expense drift detection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Vendor List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400">
            Vendor Directory ({vendors?.length ?? 0})
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {loadingVendors ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading vendors...</div>
            ) : vendors && vendors.length > 0 ? (
              vendors.map((v) => {
                const isSelected = activeVendorName === v.name;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVendor(v.name)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600/15 border-violet-500 shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-white truncate">{v.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {v.default_category} • {v.invoice_count} invoices
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-mono font-bold text-white">
                          {formatCents(v.total_spend_cents)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          avg {formatCents(v.average_amount_cents)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">
                No vendor profiles stored yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Vendor Drift & Historical Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {loadingComparison ? (
            <div className="p-12 text-center text-xs text-slate-500">Computing vendor comparisons...</div>
          ) : comparison ? (
            <div className="space-y-4">
              {/* Drift Status Banner */}
              <div
                className={`p-5 rounded-2xl border ${
                  comparison.is_drift_detected
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {comparison.vendor_name}
                      </h3>
                      {comparison.historical_count >= 2 ? (
                        comparison.is_drift_detected ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Price Drift ({comparison.difference_pct > 0 ? '+' : ''}
                            {comparison.difference_pct}%)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Normal Spending Range
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Single Invoice (Baseline)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {comparison.historical_count >= 2
                        ? `Current invoice of ${formatCents(comparison.current_amount_cents)} differs by ${
                            comparison.difference_pct > 0 ? '+' : ''
                          }${comparison.difference_pct}% from historical average (${formatCents(
                            comparison.historical_average_cents
                          )}) across ${comparison.historical_count} prior invoices.`
                        : `Baseline document registered at ${formatCents(
                            comparison.current_amount_cents
                          )}. Future invoices will be compared against this baseline.`}
                    </p>

                    <p className="text-[11px] text-slate-500 italic mt-1">
                      Note: Statistical comparisons are designed for budgeting awareness and are never accusations of fraud.
                    </p>
                  </div>
                </div>
              </div>

              {/* Historical Invoices Ledger */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="p-4 border-b border-slate-800 text-xs font-bold text-white uppercase tracking-wider">
                  Comparison Invoices Used in Calculation
                </div>

                {comparison.historical_invoices.length > 0 ? (
                  <div className="divide-y divide-slate-800/60">
                    {comparison.historical_invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/30"
                      >
                        <div>
                          <span className="font-mono font-bold text-white">
                            {inv.invoice_number || 'N/A'}
                          </span>
                          <span className="text-slate-500 ml-2">
                            {inv.invoice_date || 'Undated'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white">
                            {formatCents(inv.total_cents)}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No prior historical records for this vendor.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 border border-slate-800 rounded-2xl">
              Select a vendor from the directory to inspect historical spending.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
