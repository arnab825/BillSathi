import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Cpu,
  HardDrive,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Terminal,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);

  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: api.getHealth,
  });

  const toggleEngineMutation = useMutation({
    mutationFn: (forceFallback: boolean) => api.toggleAiEngine(forceFallback),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries();
    },
  });

  const resetMutation = useMutation({
    mutationFn: api.resetDatabase,
    onMutate: () => setResetting(true),
    onSettled: () => {
      setResetting(false);
      refetch();
      queryClient.invalidateQueries();
    },
  });

  const isOllama = health?.ai.active_provider === 'ollama';
  const isForcedFallback = health?.ai.forced_fallback ?? false;

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          System Settings & AI Model Controls
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure local open-weight AI inference, inspect storage health, and review operational limitations.
        </p>
      </div>

      {/* Model Information Panel */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Open-Weight AI Runtime Status</h2>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Connectivity
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Provider Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Extraction Provider
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOllama ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-base font-bold text-white">
                {isOllama
                  ? `Ollama (${health?.ai.ollama.configured_model})`
                  : 'Deterministic Fallback Engine (Regex)'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isOllama
                ? 'Connected to local Ollama inference server.'
                : 'Using deterministic fallback engine. All extraction and verification tests remain 100% operational.'}
            </p>
          </div>

          {/* Model Connectivity & Latency */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Inference Health & Latency
            </div>
            <div className="text-base font-mono font-bold text-white">
              {isOllama
                ? `${health?.ai.ollama.last_latency_ms.toFixed(1)} ms`
                : `${health?.ai.fallback.last_latency_ms.toFixed(1)} ms`}
            </div>
            <p className="text-xs text-slate-400">
              Configured Endpoint: <span className="font-mono text-[11px] text-slate-300">{health?.ai.ollama.configured_url}</span>
            </p>
          </div>
        </div>

        {/* Engine Switcher */}
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-indigo-300">
              Engine Fallback Toggle (For Demos & Testing)
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Force the deterministic regex engine even when Ollama is running to simulate offline environments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleEngineMutation.mutate(!isForcedFallback)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isForcedFallback
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isForcedFallback ? 'Forced Fallback Active' : 'Auto (Prefer Ollama)'}
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            Local Model Setup Instructions
          </div>
          <p>
            To run Gemma 3 or Gemma 2 locally via Ollama:
          </p>
          <pre className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-indigo-300 overflow-x-auto">
            ollama run gemma2:2b
          </pre>
          <p className="text-[11px] text-slate-500">
            Once running on port 11434, BillSathi automatically detects Ollama and switches to open-weight AI extraction.
          </p>
        </div>
      </div>

      {/* Trade-Offs Explanation: Local vs Hosted AI */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-cyan-400" />
          Technical Trade-Offs: Local Open-Weight vs Hosted LLM
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h3 className="font-bold text-emerald-400">Local Open-Weight AI (BillSathi Architecture)</h3>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400">
              <li><strong className="text-slate-200">Data Privacy:</strong> Zero financial documents ever leave the user's computer or server.</li>
              <li><strong className="text-slate-200">Predictable Cost:</strong> No per-token billing or surprise cloud invoices.</li>
              <li><strong className="text-slate-200">Offline Resilience:</strong> Fully functional on air-gapped systems.</li>
              <li><strong className="text-slate-200">Trade-off:</strong> Requires 4GB-8GB VRAM/RAM; latency depends on local hardware.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h3 className="font-bold text-amber-400">Hosted LLM APIs (Proprietary Wrappers)</h3>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400">
              <li><strong className="text-slate-200">Zero Hardware Setup:</strong> Runs on lightweight devices with instant API keys.</li>
              <li><strong className="text-slate-200">Higher Context Capacity:</strong> Large frontier models handle massive multi-page contracts.</li>
              <li><strong className="text-slate-200">Trade-off:</strong> Confidential financial data transmitted to third parties.</li>
              <li><strong className="text-slate-200">Trade-off:</strong> Recurring monthly token fees and rate-limit vulnerability.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Storage & Data Retention Policy */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Storage & Data Management</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {health?.storage.upload_count ?? 0} files stored
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          BillSathi stores documents inside private application data directories. Deleting a document
          completely cascades through the SQLite database and removes physical files from disk.
        </p>

        <div className="pt-2">
          <button
            type="button"
            disabled={resetting}
            onClick={() => {
              if (
                confirm(
                  'Are you sure you want to completely reset the database and delete all stored invoices?'
                )
              ) {
                resetMutation.mutate();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {resetting ? 'Resetting Database...' : 'Reset Database & Clear All Invoices'}
          </button>
        </div>
      </div>
    </div>
  );
};
