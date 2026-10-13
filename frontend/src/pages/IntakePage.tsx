import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  FileText,
  Trash2,
  Eye,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { api, DocumentItem } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';

export const IntakePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHashPreview, setFileHashPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch documents list
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documentsList'],
    queryFn: () => api.listDocuments(),
  });

  // Calculate client SHA-256 preview
  const handleFileSelection = async (file: File) => {
    setErrorMsg(null);
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(ext)) {
      setErrorMsg(`Unsupported file type '${ext}'. Please upload a PDF, PNG, or JPEG.`);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File exceeds 15 MB limit.');
      return;
    }

    setSelectedFile(file);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setFileHashPreview(hashHex);
    } catch (e) {
      console.warn('Could not compute client hash preview', e);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadDocument(file),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries();
      setSelectedFile(null);
      setFileHashPreview(null);
      navigate(`/workspace?docId=${newDoc.id}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to upload and process document.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Document Intake</h1>
        <p className="text-sm text-slate-400 mt-1">
          Import invoices and receipts. Cryptographic hashing guarantees deduplication before processing.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all bg-slate-900/40 backdrop-blur-sm ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelection(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              Drop invoices or receipts here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
              >
                browse files
              </button>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports vector & scanned PDF, PNG, JPEG (up to 15MB).
            </p>
          </div>

          {/* Selected File Card Preview */}
          {selectedFile && (
            <div className="w-full max-w-lg p-4 rounded-xl bg-slate-950 border border-indigo-500/40 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileHashPreview(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              </div>

              {fileHashPreview && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 break-all flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>SHA-256: {fileHashPreview}</span>
                </div>
              )}

              <button
                type="button"
                disabled={uploadMutation.isPending}
                onClick={() => uploadMutation.mutate(selectedFile)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {uploadMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing with Open-Weight AI & Validation...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Extract & Verify Document
                  </>
                )}
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Documents History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Document Intake Ledger
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {documents?.length ?? 0} files stored
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading documents...</div>
        ) : documents && documents.length > 0 ? (
          <div className="divide-y divide-slate-800/60">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 mt-0.5">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {doc.filename}
                      </span>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-3">
                      <span>Hash: {doc.file_hash.substring(0, 12)}...</span>
                      <span>•</span>
                      <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    to={`/workspace?docId=${doc.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Evidence
                  </Link>

                  <button
                    onClick={() => {
                      if (confirm(`Delete document '${doc.filename}'?`)) {
                        deleteMutation.mutate(doc.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            No documents uploaded yet. Drop a PDF or use the demo seeder on the Dashboard.
          </div>
        )}
      </div>
    </div>
  );
};
