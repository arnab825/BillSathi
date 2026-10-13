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
  User,
  ChevronDown,
  Briefcase,
  Check,
  Plus,
  ShieldCheck,
  Command,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { AccountModal } from '../account/AccountModal';
import { CommandPalette } from '../common/CommandPalette';
import { useToast } from '../../context/ToastContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const workspaceRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Keyboard shortcut for Command Palette
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch real user account & workspaces from SQLite
  const { data: account } = useQuery({
    queryKey: ['userAccount'],
    queryFn: api.getAccount,
  });

  const switchWorkspaceMutation = useMutation({
    mutationFn: api.switchWorkspace,
    onSuccess: (data, wsId) => {
      const switchedWs = data.workspaces.find((w) => w.id === wsId);
      toast.success('Workspace Switched', `Active ledger: ${switchedWs?.name || wsId}`);
      setWorkspaceMenuOpen(false);
      queryClient.invalidateQueries();
    },
  });

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
    onSuccess: (res) => {
      toast.success('Synthetic Demo Seeded', `Generated ${res.documents_created} invoices in SQLite`);
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

  const activeWorkspace = account?.workspaces.find((w) => w.id === account.active_workspace_id);
  const initials = account?.full_name
    ? account.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
    : 'AR';

  return (
    <div className="min-h-screen bg-[#111827] text-[#F9FAFB] flex font-sans">
      {/* Real Account Profile Modal */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />

      {/* Global Quick Search & Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

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

        {/* Real Workspace Switcher Header & Interactive Dropdown */}
        {!collapsed && (
          <div ref={workspaceRef} className="p-3 border-b border-[#374151] relative">
            <button
              type="button"
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="w-full p-2.5 rounded-xl bg-[#111827] border border-[#374151] hover:border-[#10B981]/50 text-left btn-transition flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] text-[10px] font-bold flex-shrink-0">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-[#F9FAFB] truncate">
                    {activeWorkspace?.name || account?.business_name || 'My Business Entity'}
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] truncate">
                    {account?.role || 'Principal Consultant'}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#F9FAFB] transition-transform duration-200 flex-shrink-0 ${
                  workspaceMenuOpen ? 'rotate-180 text-[#10B981]' : ''
                }`}
              />
            </button>

            {/* Floating Workspace Switcher Popover */}
            {workspaceMenuOpen && (
              <div className="absolute left-3 right-3 top-[68px] z-50 p-1.5 rounded-xl bg-[#1F2937]/98 border border-[#374151] shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Switch Workspace
                </div>
                {account?.workspaces.map((ws) => {
                  const isActive = ws.id === account.active_workspace_id;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => switchWorkspaceMutation.mutate(ws.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs btn-transition group ${
                        isActive
                          ? 'bg-[#10B981]/15 text-[#10B981] font-bold'
                          : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#283548]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate text-xs font-medium">{ws.name}</div>
                        <div className="text-[10px] text-[#9CA3AF] truncate">{ws.type}</div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />}
                    </button>
                  );
                })}

                <div className="pt-1 border-t border-[#374151]/80 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      setAccountModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] text-[#10B981] hover:bg-[#283548] font-semibold btn-transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Workspace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      setAccountModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#283548] btn-transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>Manage Tax Entity & Profile</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Sidebar Footer Account Card */}
        <div className="p-3 border-t border-[#374151] flex-shrink-0">
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setAccountModalOpen(true)}
              className="w-full p-2 rounded-lg hover:bg-[#283548] btn-transition flex items-center gap-2.5 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] font-bold text-xs flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#F9FAFB] truncate">
                  {account?.full_name || 'Alex Rivera'}
                </div>
                <div className="text-[10px] text-[#9CA3AF] truncate">
                  {account?.email || 'alex@billsathi.local'}
                </div>
              </div>
              <Settings className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAccountModalOpen(true)}
              className="w-full flex justify-center p-1 rounded hover:bg-[#283548]"
              title={`Account: ${account?.full_name || 'Alex Rivera'}`}
            >
              <div className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] font-bold text-xs">
                {initials}
              </div>
            </button>
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

            {/* Command Palette Search Trigger */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#111827] border border-[#374151] hover:border-[#10B981]/50 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] btn-transition group shadow-inner text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#10B981] btn-transition flex-shrink-0" />
                <span className="truncate">Search vendor, invoice number, or audit issue...</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-[#9CA3AF] bg-[#1F2937] px-1.5 py-0.5 rounded border border-[#374151] flex-shrink-0">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* AI Model Status Badge */}
            <Link
              to="/settings"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111827] border border-[#374151] hover:border-[#10B981]/50 btn-transition shadow-sm"
              title="Click to view AI engine settings"
            >
              <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
              <span
                className={`w-2 h-2 rounded-full ${
                  isOllama ? 'bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-[#F59E0B]'
                }`}
              />
              <span className="text-[11px] font-semibold text-[#F9FAFB]">
                {isOllama ? 'Gemma 2 (Local AI)' : 'Deterministic Engine'}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25 text-xs font-semibold btn-transition disabled:opacity-50 shadow-sm"
              title="Generates 3 synthetic invoices: Normal, Duplicate, and Arithmetic Error"
            >
              {seedMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">Seed Demo</span>
            </button>

            {/* Interactive User Account Profile Dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#111827] border border-transparent hover:border-[#374151] btn-transition text-left"
                title="Account Profile & Settings"
              >
                <div className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] text-xs font-bold shadow-sm">
                  {initials}
                </div>
                <div className="hidden xl:block">
                  <div className="text-xs font-bold text-[#F9FAFB] leading-none">
                    {account?.full_name || 'Alex Rivera'}
                  </div>
                  <div className="text-[10px] text-[#10B981] font-mono leading-tight mt-0.5">
                    {activeWorkspace?.name || account?.business_name || 'Rivera Digital Labs'}
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform duration-200 hidden xl:block ${
                    userMenuOpen ? 'rotate-180 text-[#10B981]' : ''
                  }`}
                />
              </button>

              {/* Floating User Menu Popover */}
              {userMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 p-2 rounded-2xl bg-[#1F2937]/98 border border-[#374151] shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#111827] border border-[#374151]/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F9FAFB]">
                        {account?.full_name || 'Alex Rivera'}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        {account?.role || 'Admin'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] truncate">
                      {account?.email || 'alex@rivera.tech'}
                    </div>
                    <div className="text-[10px] font-mono text-[#10B981] pt-0.5 truncate">
                      {account?.business_name || 'Rivera Digital Labs LLC'} • {account?.tax_id || 'EIN-84-2918471'}
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setAccountModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[#F9FAFB] hover:bg-[#283548] btn-transition"
                    >
                      <Briefcase className="w-4 h-4 text-[#10B981]" />
                      <span>Business Profile & Workspaces</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[#F9FAFB] hover:bg-[#283548] btn-transition"
                    >
                      <Settings className="w-4 h-4 text-[#60A5FA]" />
                      <span>System Settings & Local AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/register');
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[#F9FAFB] hover:bg-[#283548] btn-transition"
                    >
                      <Receipt className="w-4 h-4 text-[#F59E0B]" />
                      <span>Accountant CSV Ledger</span>
                    </button>
                  </div>
                </div>
              )}
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
              {account?.business_name || 'Rivera Digital Labs LLC'} • Tax ID: {account?.tax_id || 'EIN-84-2918471'}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
