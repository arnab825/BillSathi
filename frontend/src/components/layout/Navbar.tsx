import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  LayoutDashboard,
  UploadCloud,
  Eye,
  AlertTriangle,
  Receipt,
  Building2,
  Settings,
  Sparkles,
  Cpu,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: api.getHealth,
    refetchInterval: 10000,
  });

  const isOllama = health?.ai.active_provider === 'ollama';

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/intake', label: 'Intake', icon: UploadCloud },
    { to: '/workspace', label: 'Evidence Workspace', icon: Eye },
    { to: '/anomalies', label: 'Anomaly Center', icon: AlertTriangle },
    { to: '/register', label: 'Financial Register', icon: Receipt },
    { to: '/vendors', label: 'Vendor Intelligence', icon: Building2 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  BillSathi
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5">
                Proof Before Trust
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* AI Runtime Status & Quick Health */}
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              title="Click to view AI Runtime settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all bg-slate-900/80 hover:border-indigo-500/50"
              style={{
                borderColor: isOllama ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)',
              }}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOllama ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="text-slate-300 font-sans font-medium text-[11px]">
                  {isOllama ? 'Ollama: Gemma 3' : 'Fallback Engine (Regex)'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
