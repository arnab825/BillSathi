import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  TrendingUp,
  Search,
} from 'lucide-react';
import { api } from '../api/client';
import { formatCents } from '../components/common/StatusBadge';

export const VendorIntelligencePage: React.FC = () => {
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: vendors, isLoading: loadingVendors } = useQuery({
    queryKey: ['vendorsList'],
    queryFn: api.listVendors,
  });

  const filteredVendors = vendors?.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.default_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeVendorName = selectedVendor || (filteredVendors && filteredVendors.length > 0 ? filteredVendors[0].name : null);

  const { data: comparison, isLoading: loadingComparison } = useQuery({
    queryKey: ['vendorComparison', activeVendorName],
    queryFn: () => (activeVendorName ? api.getVendorComparison(activeVendorName) : null),
    enabled: !!activeVendorName,
  });

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      <div className="border-b border-[#374151] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F9FAFB] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#10B981]" />
          Vendor Spending Intelligence & Volatility Analysis
        </h1>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Historical invoice tracking, average cost calculations, and explainable expense drift detection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Vendor List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="p-3 rounded-xl border border-[#374151] bg-[#1F2937] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              <span>Vendor Directory ({filteredVendors?.length ?? 0})</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendor or category..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#10B981]"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {loadingVendors ? (
              <div className="p-8 text-center text-xs text-[#9CA3AF]">Loading vendors...</div>
            ) : filteredVendors && filteredVendors.length > 0 ? (
              filteredVendors.map((v) => {
                const isSelected = activeVendorName === v.name;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVendor(v.name)}
                    className={`p-3.5 rounded-xl border btn-transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#10B981]/10 border-[#10B981]'
                        : 'bg-[#1F2937] border-[#374151] hover:border-[#4B5563]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-[#F9FAFB] truncate">{v.name}</div>
                        <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                          {v.default_category} • {v.invoice_count} bills
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-mono font-bold text-[#F9FAFB] tabular-nums">
                          {formatCents(v.total_spend_cents)}
                        </div>
                        <div className="text-[10px] text-[#6B7280]">
                          avg {formatCents(v.average_amount_cents)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-xs text-[#6B7280] border border-[#374151] rounded-xl bg-[#1F2937]">
                No vendor profiles stored yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Vendor Drift & Historical Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          {loadingComparison ? (
            <div className="p-12 text-center text-xs text-[#9CA3AF]">
              Computing vendor comparisons...
            </div>
          ) : comparison ? (
            <div className="space-y-3.5">
              {/* Drift Status Banner */}
              <div
                className={`p-4 rounded-xl border ${
                  comparison.is_drift_detected
                    ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                    : 'bg-[#1F2937] border-[#374151] text-[#9CA3AF]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#F9FAFB]">
                        {comparison.vendor_name}
                      </h3>
                      {comparison.historical_count >= 2 ? (
                        comparison.is_drift_detected ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                            Price Drift ({comparison.difference_pct > 0 ? '+' : ''}
                            {comparison.difference_pct}%)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            Normal Spending Range
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#111827] text-[#9CA3AF] border border-[#374151]">
                          Single Invoice (Baseline)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#9CA3AF] leading-relaxed">
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

                    <p className="text-[11px] text-[#6B7280] italic mt-1">
                      Note: Statistical comparisons are designed for budgeting awareness and are never accusations of fraud.
                    </p>
                  </div>
                </div>
              </div>

              {/* Historical Invoices Ledger */}
              <div className="rounded-xl border border-[#374151] bg-[#1F2937] overflow-hidden">
                <div className="p-3.5 border-b border-[#374151] text-xs font-bold text-[#F9FAFB] uppercase tracking-wider">
                  Comparison Invoices Used in Calculation
                </div>

                {comparison.historical_invoices.length > 0 ? (
                  <div className="divide-y divide-[#374151]">
                    {comparison.historical_invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 flex items-center justify-between text-xs hover:bg-[#283548] btn-transition"
                      >
                        <div>
                          <span className="font-mono font-bold text-[#F9FAFB]">
                            {inv.invoice_number || 'N/A'}
                          </span>
                          <span className="text-[#9CA3AF] ml-2">
                            {inv.invoice_date || 'Undated'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-[#F9FAFB] tabular-nums">
                            {formatCents(inv.total_cents)}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#111827] text-[#9CA3AF] border border-[#374151]">
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#6B7280]">
                    No prior historical records for this vendor.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#6B7280] border border-[#374151] rounded-xl bg-[#1F2937]">
              Select a vendor from the directory to inspect historical spending.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
