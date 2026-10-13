export interface ExtractedFieldItem {
  id: string;
  field_name: string;
  original_text: string | null;
  normalized_value: string | null;
  user_corrected_value: string | null;
  page_number: number;
  bbox_json: string | null;
  extraction_method: string;
  confidence: number;
  is_reviewed: boolean;
  is_corrected: boolean;
  validation_status: 'valid' | 'warning' | 'error' | 'unverified';
}

export interface FinancialRecordItem {
  id: string;
  document_id: string;
  vendor_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  currency: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  category: string;
  description: string | null;
  payment_terms: string | null;
  status: 'Needs review' | 'Reviewed' | 'Confirmed' | 'Exported';
  confirmed_at: string | null;
  confirmed_by: string | null;
  exported_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnomalyItem {
  id: string;
  document_id: string;
  rule_code: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  affected_fields: string;
  is_resolved: boolean;
  resolution_action: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  action_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  user_note: string | null;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_hash: string;
  mime_type: string;
  file_size: number;
  page_count: number;
  status: string;
  ocr_applied: boolean;
  raw_text: string | null;
  error_message: string | null;
  financial_record?: FinancialRecordItem | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetailItem extends DocumentItem {
  extracted_fields: ExtractedFieldItem[];
  financial_record: FinancialRecordItem | null;
  anomalies: AnomalyItem[];
  audit_logs: AuditLogItem[];
}

export interface DashboardStats {
  total_documents: number;
  imported_count: number;
  needs_review_count: number;
  reviewed_count: number;
  confirmed_count: number;
  exported_count: number;
  total_anomalies: number;
  unresolved_anomalies: number;
  potential_duplicates: number;
  total_spend_cents: number;
  confirmed_spend_cents: number;
  recent_vendors: Array<{
    name: string;
    category: string;
    total_spend_cents: number;
    invoice_count: number;
    average_amount_cents: number;
  }>;
  monthly_breakdown: Array<{
    month: string;
    total_spend_cents: number;
  }>;
}

export interface SystemHealth {
  status: string;
  app_name: string;
  version: string;
  database: string;
  ai: {
    active_provider: string;
    forced_fallback: boolean;
    ollama: {
      configured_url: string;
      configured_model: string;
      is_reachable: boolean;
      last_latency_ms: number;
    };
    fallback: {
      is_ready: boolean;
      last_latency_ms: number;
    };
    instructions: string;
  };
  storage: {
    upload_count: number;
    preview_count: number;
    upload_dir: string;
  };
}

export interface VendorProfile {
  id: string;
  name: string;
  default_category: string;
  total_spend_cents: number;
  invoice_count: number;
  average_amount_cents: number;
  min_amount_cents: number;
  max_amount_cents: number;
  first_seen_at: string;
  last_seen_at: string;
}

export interface VendorComparison {
  vendor_name: string;
  current_invoice_number: string | null;
  current_amount_cents: number;
  historical_count: number;
  historical_average_cents: number;
  historical_min_cents: number;
  historical_max_cents: number;
  difference_pct: number;
  is_drift_detected: boolean;
  historical_invoices: Array<{
    id: string;
    document_id: string;
    invoice_number: string | null;
    invoice_date: string | null;
    total_cents: number;
    category: string;
    status: string;
  }>;
}

const API_BASE = '/api';

export const api = {
  // System & Dashboard
  getDashboard: async (period?: any): Promise<DashboardStats> => {
    const p = typeof period === 'string' ? period : 'all';
    const res = await fetch(`${API_BASE}/system/dashboard?period=${encodeURIComponent(p)}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  getHealth: async (): Promise<SystemHealth> => {
    const res = await fetch(`${API_BASE}/system/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  seedDemo: async () => {
    const res = await fetch(`${API_BASE}/system/seed-demo`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed demo invoices');
    return res.json();
  },

  resetDatabase: async () => {
    const res = await fetch(`${API_BASE}/system/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset database');
    return res.json();
  },

  toggleAiEngine: async (forceFallback: boolean) => {
    const res = await fetch(`${API_BASE}/system/toggle-ai-engine?force_fallback=${forceFallback}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle AI engine');
    return res.json();
  },

  // Documents
  listDocuments: async (status?: string, search?: string): Promise<DocumentItem[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/documents?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  getDocument: async (id: string): Promise<DocumentDetailItem> => {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch document detail');
    return res.json();
  },

  uploadDocument: async (file: File): Promise<DocumentDetailItem> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  },

  deleteDocument: async (id: string) => {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  reprocessDocument: async (id: string): Promise<DocumentDetailItem> => {
    const res = await fetch(`${API_BASE}/documents/${id}/reprocess`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reprocess document');
    return res.json();
  },

  // Financial Records
  listRecords: async (filters?: {
    status?: string;
    vendor?: string;
    category?: string;
    search?: string;
  }): Promise<FinancialRecordItem[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vendor) params.append('vendor', filters.vendor);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    const res = await fetch(`${API_BASE}/records?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch financial records');
    return res.json();
  },

  updateRecord: async (id: string, data: Partial<FinancialRecordItem> & { user_note?: string }) => {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update financial record');
    return res.json();
  },

  confirmRecord: async (id: string, reviewer = 'Human Reviewer') => {
    const res = await fetch(`${API_BASE}/records/${id}/confirm?reviewer_name=${encodeURIComponent(reviewer)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to confirm record');
    return res.json();
  },

  updateField: async (fieldId: string, correctedValue: string, note?: string) => {
    const res = await fetch(`${API_BASE}/records/fields/${fieldId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_corrected_value: correctedValue, user_note: note }),
    });
    if (!res.ok) throw new Error('Failed to update extracted field');
    return res.json();
  },

  // Anomalies
  listAnomalies: async (unresolvedOnly = false): Promise<AnomalyItem[]> => {
    const res = await fetch(`${API_BASE}/anomalies?unresolved_only=${unresolvedOnly}`);
    if (!res.ok) throw new Error('Failed to fetch anomalies');
    return res.json();
  },

  resolveAnomaly: async (id: string, action: string, note?: string) => {
    const res = await fetch(`${API_BASE}/anomalies/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_action: action, resolution_note: note }),
    });
    if (!res.ok) throw new Error('Failed to resolve anomaly');
    return res.json();
  },

  // Vendors
  listVendors: async (): Promise<VendorProfile[]> => {
    const res = await fetch(`${API_BASE}/vendors`);
    if (!res.ok) throw new Error('Failed to fetch vendors');
    return res.json();
  },

  getVendorComparison: async (vendorName: string, currentInvoiceId?: string): Promise<VendorComparison> => {
    const url = currentInvoiceId
      ? `${API_BASE}/vendors/${encodeURIComponent(vendorName)}/comparison?current_invoice_id=${currentInvoiceId}`
      : `${API_BASE}/vendors/${encodeURIComponent(vendorName)}/comparison`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch vendor comparison');
    return res.json();
  },

  // Export
  getExportCsvUrl: (status?: string) => {
    return `${API_BASE}/export/csv${status ? `?status=${status}` : ''}`;
  },

  // User Account & Workspaces
  getAccount: async (): Promise<UserAccountProfile> => {
    const res = await fetch(`${API_BASE}/account/me`);
    if (!res.ok) throw new Error('Failed to fetch account profile');
    return res.json();
  },

  updateAccount: async (data: Partial<UserAccountProfile>): Promise<UserAccountProfile> => {
    const res = await fetch(`${API_BASE}/account/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update account profile');
    return res.json();
  },

  switchWorkspace: async (workspaceId: string): Promise<UserAccountProfile> => {
    const res = await fetch(`${API_BASE}/account/switch-workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId }),
    });
    if (!res.ok) throw new Error('Failed to switch workspace');
    return res.json();
  },

  createWorkspace: async (name: string, type = 'LLC / Consulting'): Promise<UserAccountProfile> => {
    const res = await fetch(`${API_BASE}/account/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    });
    if (!res.ok) throw new Error('Failed to create workspace');
    return res.json();
  },
};

export interface WorkspaceItem {
  id: string;
  name: string;
  type: string;
  is_default: boolean;
}

export interface UserAccountProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  business_name: string;
  tax_id: string;
  home_currency: string;
  accountant_email: string | null;
  fiscal_year_start: string;
  active_workspace_id: string;
  avatar_url?: string | null;
  workspaces: WorkspaceItem[];
  created_at: string;
  updated_at: string;
}
