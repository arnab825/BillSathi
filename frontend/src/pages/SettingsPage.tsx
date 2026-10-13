import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Cpu,
  HardDrive,
  Trash2,
  RefreshCw,
  Info,
  Terminal,
} from 'lucide-react';
import { api } from '../api/client';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);

  const { data: health, refetch } = useQuery({
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
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      <div className="border-b border-[#374151] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F9FAFB] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#10B981]" />
          System Settings & AI Model Controls
        </h1>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Configure local open-weight AI inference, inspect storage health, and review operational limitations.
        </p>
      </div>

      {/* Model Information Panel */}
      <div className="p-5 rounded-xl border border-[#374151] bg-[#1F2937] space-y-5">
        <div className="flex items-center justify-between border-b border-[#374151] pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-sm font-bold text-[#F9FAFB]">Open-Weight AI Runtime Status</h2>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-[#10B981] hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Check Health
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Active Provider Card */}
          <div className="p-3.5 rounded-lg bg-[#111827] border border-[#374151] space-y-1.5">
            <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              Active Extraction Provider
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOllama ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'
                }`}
              />
              <span className="text-sm font-bold text-[#F9FAFB]">
                {isOllama
                  ? `Ollama (${health?.ai.ollama.configured_model})`
                  : 'Deterministic Fallback Engine (Regex Heuristic)'}
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              {isOllama
                ? 'Connected to local Ollama inference server.'
                : 'Using deterministic regex engine. Document extraction, coordinate bounding boxes, and financial audits remain 100% operational.'}
            </p>
          </div>

          {/* Model Connectivity & Latency */}
          <div className="p-3.5 rounded-lg bg-[#111827] border border-[#374151] space-y-1.5">
            <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              Inference Latency & Endpoint
            </div>
            <div className="text-sm font-mono font-bold text-[#F9FAFB] tabular-nums">
              {isOllama
                ? `${health?.ai.ollama.last_latency_ms.toFixed(1)} ms`
                : `${health?.ai.fallback.last_latency_ms.toFixed(1)} ms`}
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Endpoint: <span className="font-mono text-[11px] text-[#F9FAFB]">{health?.ai.ollama.configured_url}</span>
            </p>
          </div>
        </div>

        {/* Engine Switcher */}
        <div className="p-3.5 rounded-lg bg-[#111827] border border-[#374151] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#F9FAFB]">
              AI Engine Fallback Toggle (For Demonstrations & Offline Testing)
            </div>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Simulates an offline environment by forcing the built-in deterministic regex engine even when Ollama is running.
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleEngineMutation.mutate(!isForcedFallback)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold btn-transition flex items-center gap-1.5 ${
              isForcedFallback
                ? 'bg-[#F59E0B] text-black'
                : 'bg-[#1F2937] text-[#F9FAFB] border border-[#374151] hover:bg-[#283548]'
            }`}
          >
            {isForcedFallback ? 'Forced Fallback Active' : 'Auto (Prefer Ollama)'}
          </button>
        </div>

        {/* Setup Instructions */}
        <div className="p-3.5 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#9CA3AF] space-y-1.5">
          <div className="font-bold text-[#F9FAFB] flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#10B981]" />
            Local Open-Weight Model Setup Instructions
          </div>
          <p>
            To run Gemma 3 or Gemma 2 locally via Ollama:
          </p>
          <pre className="p-2 rounded bg-[#1F2937] font-mono text-[11px] text-[#10B981] overflow-x-auto border border-[#374151]">
            ollama run gemma2:2b
          </pre>
          <p className="text-[11px] text-[#6B7280]">
            Once active on port 11434, BillSathi automatically detects Ollama and switches to open-weight AI extraction.
          </p>
        </div>
      </div>

      {/* Trade-Offs Explanation: Local vs Hosted AI */}
      <div className="p-5 rounded-xl border border-[#374151] bg-[#1F2937] space-y-3.5">
        <h2 className="text-sm font-bold text-[#F9FAFB] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#60A5FA]" />
          Technical Trade-Offs: Local Open-Weight vs Hosted Frontier Models
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-[#9CA3AF] leading-relaxed">
          <div className="p-3.5 rounded-lg bg-[#111827] border border-[#374151] space-y-1.5">
            <h3 className="font-bold text-[#10B981]">Local Open-Weight AI (BillSathi Architecture)</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong className="text-[#F9FAFB]">Data Confidentiality:</strong> Zero documents or financial data leave your computer.</li>
              <li><strong className="text-[#F9FAFB]">Zero Token Fees:</strong> No recurring monthly per-token API billing.</li>
              <li><strong className="text-[#F9FAFB]">Offline Reliability:</strong> Runs in air-gapped or disconnected environments.</li>
              <li><strong className="text-[#9CA3AF]">Trade-off:</strong> Requires 4GB–8GB RAM/VRAM on user machine.</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-[#111827] border border-[#374151] space-y-1.5">
            <h3 className="font-bold text-[#F59E0B]">Hosted Frontier LLM APIs (Proprietary Wrappers)</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong className="text-[#F9FAFB]">Zero Local Hardware:</strong> Runs on any device with simple API key.</li>
              <li><strong className="text-[#F9FAFB]">Context Scale:</strong> Large frontier models handle massive multi-page documents.</li>
              <li><strong className="text-[#9CA3AF]">Trade-off:</strong> Confidential banking receipts transmitted to cloud servers.</li>
              <li><strong className="text-[#9CA3AF]">Trade-off:</strong> Ongoing monthly cloud API fees and vendor lock-in.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Storage & Data Retention Policy */}
      <div className="p-5 rounded-xl border border-[#374151] bg-[#1F2937] space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#374151] pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-sm font-bold text-[#F9FAFB]">Storage & Data Retention</h2>
          </div>
          <span className="text-xs font-mono text-[#9CA3AF] tabular-nums">
            {health?.storage.upload_count ?? 0} files stored
          </span>
        </div>

        <p className="text-xs text-[#9CA3AF] leading-relaxed">
          BillSathi stores documents inside private application data directories. Deleting a document completely cascades through the SQLite database and removes original files and rendered page PNGs from disk.
        </p>

        <div className="pt-1">
          <button
            type="button"
            disabled={resetting}
            onClick={() => {
              if (
                confirm(
                  'Are you sure you want to reset the database and delete all stored invoices?'
                )
              ) {
                resetMutation.mutate();
              }
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#F87171]/15 hover:bg-[#F87171]/25 text-[#F87171] border border-[#F87171]/30 text-xs font-bold btn-transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {resetting ? 'Resetting Database...' : 'Reset Database & Clear All Invoices'}
          </button>
        </div>
      </div>
    </div>
  );
};
