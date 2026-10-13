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
  HardDrive,
  Check,
} from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';

export const IntakePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
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
      setErrorMsg(`Unsupported file format '${ext}'. Please upload a standard PDF, PNG, or JPEG.`);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File exceeds maximum size limit of 15 MB.');
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
      toast.success('Document Ingested', `Extracted financial records from ${newDoc.filename}`);
      navigate(`/workspace?docId=${newDoc.id}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to upload and process document.');
      toast.error('Upload Failed', err.message || 'Error processing document');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => {
      toast.info('Document Removed', 'Invoice records and rendered preview images deleted');
      queryClient.invalidateQueries();
    },
  });

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      <div className="border-b border-[#374151] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F9FAFB]">
          Document Intake & Verification Ledger
        </h1>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
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
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all bg-[#1F2937] ${
          dragActive
            ? 'border-[#10B981] bg-[#10B981]/5'
            : 'border-[#374151] hover:border-[#4B5563]'
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

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#111827] border border-[#374151] flex items-center justify-center text-[#10B981]">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#F9FAFB]">
              Drag and drop invoices here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#10B981] hover:underline font-bold"
              >
                browse files
              </button>
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Supports vector & scanned PDF, PNG, JPEG (up to 15 MB).
            </p>
          </div>

          {/* Selected File Card Preview */}
          {selectedFile && (
            <div className="w-full max-w-md p-3.5 rounded-lg bg-[#111827] border border-[#374151] text-left space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#F9FAFB] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF] font-mono tabular-nums">
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
                  className="text-xs text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  Clear
                </button>
              </div>

              {fileHashPreview && (
                <div className="p-2 rounded bg-[#1F2937] border border-[#374151] text-[10px] font-mono text-[#9CA3AF] break-all flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-[#10B981] flex-shrink-0" />
                  <span>SHA-256: {fileHashPreview}</span>
                </div>
              )}

              <button
                type="button"
                disabled={uploadMutation.isPending}
                onClick={() => uploadMutation.mutate(selectedFile)}
                className="w-full py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold flex items-center justify-center gap-2 btn-transition disabled:opacity-50"
              >
                {uploadMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Extracting & Running Verification...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5" />
                    Extract & Verify Document
                  </>
                )}
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Documents History */}
      <div className="rounded-xl border border-[#374151] bg-[#1F2937] overflow-hidden">
        <div className="p-4 border-b border-[#374151] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-xs font-bold text-[#F9FAFB] uppercase tracking-wider">
              Document Intake Ledger
            </h2>
          </div>
          <span className="text-xs font-mono text-[#9CA3AF] tabular-nums">
            {documents?.length ?? 0} files stored
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#9CA3AF]">Loading documents...</div>
        ) : documents && documents.length > 0 ? (
          <div className="divide-y divide-[#374151]">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#283548] btn-transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[#111827] border border-[#374151] text-[#10B981] mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#F9FAFB] truncate">
                        {doc.filename}
                      </span>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] font-mono mt-1 flex items-center gap-3">
                      <span>Hash: {doc.file_hash.substring(0, 14)}...</span>
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 text-xs font-semibold btn-transition"
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
                    className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F87171] hover:bg-[#F87171]/10 btn-transition"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-[#6B7280] text-xs">
            No documents uploaded yet. Drop a PDF or use the demo seeder on the Dashboard.
          </div>
        )}
      </div>
    </div>
  );
};
