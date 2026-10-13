import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  CheckSquare,
  AlertTriangle,
  Building2,
  Receipt,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  Cpu,
  Sparkles,
  RefreshCw,
  FileCheck2,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch live system health
  const { data: health } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: api.getHealth,
    refetchInterval: 10000,
  });

  // Fetch stats for live unread badge counts
  const { data: stats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: api.getDashboard,
    refetchInterval: 5000,
  });

  const seedMutation = useMutation({
    mutationFn: api.seedDemo,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const isOllama = health?.ai.active_provider === 'ollama';

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/intake', label: 'Documents', icon: Files, badge: stats?.total_documents },
    {
      to: '/workspace',
      label: 'Review Queue',
      icon: CheckSquare,
      badge: stats?.needs_review_count,
      badgeColor: 'amber',
    },
    {
      to: '/anomalies',
      label: 'Anomalies',
      icon: AlertTriangle,
      badge: stats?.unresolved_anomalies,
      badgeColor: stats && stats.unresolved_anomalies > 0 ? 'red' : undefined,
    },
    { to: '/vendors', label: 'Vendors', icon: Building2 },
    { to: '/register', label: 'Reports', icon: Receipt },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/register?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-[#F9FAFB] flex font-sans">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Collapsible Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen bg-[#1F2937] border-r border-[#374151] flex flex-col transition-all duration-200 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#374151] flex-shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-9 h-9 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center flex-shrink-0 text-[#10B981]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-base tracking-tight text-[#F9FAFB] block truncate">
                  BillSathi
                </span>
                <span className="text-[10px] font-medium tracking-wide text-[#9CA3AF] block uppercase">
                  Proof Before Trust
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151] btn-transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold btn-transition group ${
                  isActive
                    ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-bold'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#283548] border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-[#10B981]' : 'text-[#9CA3AF] group-hover:text-[#F9FAFB]'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                      item.badgeColor === 'red'
                        ? 'bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30'
                        : item.badgeColor === 'amber'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                        : 'bg-[#374151] text-[#9CA3AF]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-[#374151] flex-shrink-0">
          {!collapsed ? (
            <div className="px-2 py-1 text-[11px] text-[#9CA3AF] space-y-1">
              <div className="flex items-center justify-between">
                <span>Model Engine:</span>
                <span className="font-mono text-[#10B981] font-semibold text-[10px]">
                  {isOllama ? 'Gemma 3 (Ollama)' : 'Regex Heuristic'}
                </span>
              </div>
              <div className="text-[10px] text-[#6B7280]">
                Commercial Side Hustle Edition
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title="BillSathi v1.0.0">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Compact Top Navigation Bar */}
        <header className="h-16 bg-[#1F2937] border-b border-[#374151] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleGlobalSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search vendor, invoice number, or description..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#10B981] btn-transition"
              />
            </form>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* AI Model Status Badge */}
            <Link
              to="/settings"
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#111827] border border-[#374151] hover:border-[#10B981]/50 btn-transition"
              title="Click to view AI engine settings"
            >
              <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
              <span
                className={`w-2 h-2 rounded-full ${
                  isOllama ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'
                }`}
              />
              <span className="text-[11px] font-medium text-[#F9FAFB]">
                {isOllama ? 'Gemma 3' : 'Fallback Engine'}
              </span>
              <span className="text-[10px] font-mono text-[#9CA3AF] border-l border-[#374151] pl-1.5">
                {isOllama
                  ? `${health?.ai.ollama.last_latency_ms.toFixed(0)}ms`
                  : `${health?.ai.fallback.last_latency_ms.toFixed(0)}ms`}
              </span>
            </Link>

            {/* Quick Demo Seeder Button */}
            <button
              type="button"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25 text-xs font-semibold btn-transition disabled:opacity-50"
              title="Generates 3 synthetic invoices: Normal, Duplicate, and Arithmetic Error"
            >
              {seedMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="hidden lg:inline">Seed Demo</span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#374151]">
              <div className="w-7 h-7 rounded-full bg-[#374151] flex items-center justify-center text-[#F9FAFB] text-xs font-bold border border-[#4B5563]">
                <User className="w-3.5 h-3.5 text-[#9CA3AF]" />
              </div>
              <span className="hidden xl:inline text-xs font-medium text-[#F9FAFB]">
                Freelance Studio
              </span>
            </div>
          </div>
        </header>

        {/* Main Content View with Restrained Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Subdued Financial Footer */}
        <footer className="border-t border-[#374151] py-4 px-6 text-xs text-[#9CA3AF] bg-[#111827]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-[#F9FAFB] font-bold">BillSathi</span>
              <span>•</span>
              <span className="text-[#10B981]">Proof Before Trust</span>
              <span>•</span>
              <span>Local Open-Weight AI</span>
            </div>
            <div className="text-[11px] text-[#6B7280]">
              Hacktoberfest 2026 DEV Open-Source AI Challenge • Side Hustle
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
