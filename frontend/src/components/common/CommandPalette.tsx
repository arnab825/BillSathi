import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  AlertTriangle,
  Building2,
  Sparkles,
  Upload,
  Receipt,
  Settings,
  ArrowRight,
  X,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { formatCents } from './StatusBadge';
import { useToast } from '../../context/ToastContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch documents list
  const { data: documents } = useQuery({
    queryKey: ['documentsList'],
    queryFn: () => api.listDocuments(),
    enabled: isOpen,
  });

  // Fetch anomalies list
  const { data: anomalies } = useQuery({
    queryKey: ['anomaliesList'],
    queryFn: () => api.listAnomalies(),
    enabled: isOpen,
  });

  const seedMutation = useMutation({
    mutationFn: api.seedDemo,
    onSuccess: (res) => {
      queryClient.invalidateQueries();
      toast.success('Synthetic Invoices Seeded', `Created ${res.documents_created} documents in SQLite ledger`);
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredDocs = (documents || []).filter((d) => {
    const q = query.toLowerCase();
    const vendorMatch = d.financial_record?.vendor_name.toLowerCase().includes(q);
    const fileMatch = d.filename.toLowerCase().includes(q);
    const invoiceNumMatch = d.financial_record?.invoice_number?.toLowerCase().includes(q);
    return vendorMatch || fileMatch || invoiceNumMatch;
  });

  const filteredAnomalies = (anomalies || []).filter((a) => {
    const q = query.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q);
  });

  const runAction = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl bg-[#1F2937]/95 border border-[#374151] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#374151]/80 gap-3">
          <Search className="w-5 h-5 text-[#10B981] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search vendor, invoice #, or audit anomaly..."
            className="w-full bg-transparent text-sm text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151]/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4 text-xs">
          {/* Quick Actions Group */}
          <div>
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Quick Navigation & Tools
            </div>
            <div className="space-y-1 mt-1">
              <button
                type="button"
                onClick={() => runAction('/workspace')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#283548] text-[#F9FAFB] group btn-transition"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>Go to Evidence Review Workspace</span>
                </div>
                <span className="text-[10px] text-[#9CA3AF] font-mono group-hover:text-[#F9FAFB]">
                  Review Queue
                </span>
              </button>

              <button
                type="button"
                onClick={() => runAction('/intake')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#283548] text-[#F9FAFB] group btn-transition"
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-[#60A5FA]" />
                  <span>Upload Financial Documents (PDF / PNG)</span>
                </div>
                <span className="text-[10px] text-[#9CA3AF] font-mono group-hover:text-[#F9FAFB]">
                  Intake
                </span>
              </button>

              <button
                type="button"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#283548] text-[#10B981] group btn-transition"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#10B981]" />
                  <span>Seed Synthetic Demo Invoices (Clean + Duplicate + Math Error)</span>
                </div>
                <span className="text-[10px] bg-[#10B981]/15 text-[#10B981] px-1.5 py-0.5 rounded font-mono">
                  Instant Demo
                </span>
              </button>

              <button
                type="button"
                onClick={() => runAction('/register')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#283548] text-[#F9FAFB] group btn-transition"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-[#F59E0B]" />
                  <span>Export RFC 4180 Accountant Register (CSV)</span>
                </div>
                <span className="text-[10px] text-[#9CA3AF] font-mono group-hover:text-[#F9FAFB]">
                  Tax Ready
                </span>
              </button>
            </div>
          </div>

          {/* Ingested Documents Results */}
          {filteredDocs.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                Ingested Invoices ({filteredDocs.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredDocs.slice(0, 5).map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => runAction(`/workspace?docId=${doc.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#283548] text-[#F9FAFB] btn-transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <FileText className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#10B981] flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-xs truncate">
                          {doc.financial_record?.vendor_name || doc.filename}
                        </div>
                        <div className="text-[10px] text-[#9CA3AF] truncate">
                          Invoice: {doc.financial_record?.invoice_number || 'N/A'} • {doc.filename}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-bold text-[#10B981]">
                        {formatCents(doc.financial_record?.total_cents || 0)}
                      </div>
                      <div className="text-[9px] text-[#9CA3AF]">{doc.status}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Anomalies Detected */}
          {filteredAnomalies.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F87171]">
                Active Audit Anomalies ({filteredAnomalies.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredAnomalies.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => runAction('/anomalies')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#283548] text-[#F9FAFB] btn-transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <AlertTriangle className="w-4 h-4 text-[#F87171] flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-xs text-[#F87171] truncate">{a.title}</div>
                        <div className="text-[10px] text-[#9CA3AF] truncate">{a.message}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#F87171] border border-[#F87171]/30 bg-[#F87171]/10 px-1.5 py-0.5 rounded flex-shrink-0">
                      {a.rule_code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-[#111827]/90 border-t border-[#374151]/80 flex items-center justify-between text-[11px] text-[#9CA3AF]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#1F2937] border border-[#374151] text-[10px] font-mono text-[#F9FAFB]">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#1F2937] border border-[#374151] text-[10px] font-mono text-[#F9FAFB]">
                Enter
              </kbd>{' '}
              Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#1F2937] border border-[#374151] text-[10px] font-mono text-[#F9FAFB]">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
          <span className="font-mono text-[#10B981]">BillSathi Command Bar</span>
        </div>
      </div>
    </div>
  );
};
