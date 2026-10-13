import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Building2,
  Mail,
  ShieldCheck,
  CreditCard,
  Plus,
  Check,
  X,
  Briefcase,
  Save,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api, UserAccountProfile } from '../../api/client';
import { CustomDropdown } from '../common/CustomDropdown';
import { useToast } from '../../context/ToastContext';

const currencyOptions = [
  { value: 'USD', label: 'USD ($)', description: 'United States Dollar', badge: '$' },
  { value: 'EUR', label: 'EUR (€)', description: 'European Euro', badge: '€' },
  { value: 'GBP', label: 'GBP (£)', description: 'British Pound Sterling', badge: '£' },
  { value: 'INR', label: 'INR (₹)', description: 'Indian Rupee', badge: '₹' },
  { value: 'CAD', label: 'CAD ($)', description: 'Canadian Dollar', badge: '$' },
];

const workspaceTypeOptions = [
  { value: 'LLC / Consulting', label: 'LLC / Consulting', description: 'Limited Liability Company' },
  { value: 'Sole Proprietorship', label: 'Sole Proprietorship', description: 'Individual / Freelance' },
  { value: 'C-Corp / S-Corp', label: 'C-Corp / S-Corp', description: 'Corporate entity' },
  { value: 'Freelancer Individual', label: 'Freelancer Individual', description: 'Independent 1099' },
];

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: account, isLoading } = useQuery({
    queryKey: ['userAccount'],
    queryFn: api.getAccount,
    enabled: isOpen,
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [homeCurrency, setHomeCurrency] = useState('USD');
  const [accountantEmail, setAccountantEmail] = useState('');
  const [fiscalYear, setFiscalYear] = useState('January');

  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState('LLC / Consulting');

  useEffect(() => {
    if (account) {
      setFullName(account.full_name);
      setEmail(account.email);
      setRole(account.role);
      setBusinessName(account.business_name);
      setTaxId(account.tax_id);
      setHomeCurrency(account.home_currency);
      setAccountantEmail(account.accountant_email || '');
      setFiscalYear(account.fiscal_year_start);
    }
  }, [account]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserAccountProfile>) => api.updateAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAccount'] });
      toast.success('Entity Profile Saved', 'Your fiscal configuration has been updated successfully.');
      onClose();
    },
    onError: (err: any) => {
      toast.error('Failed to Save Profile', err?.message || 'Could not update entity settings');
    },
  });

  const switchWorkspaceMutation = useMutation({
    mutationFn: (wsId: string) => api.switchWorkspace(wsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAccount'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.info('Workspace Switched', 'Active ledger workspace updated.');
    },
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: ({ name, type }: { name: string; type: string }) =>
      api.createWorkspace(name, type),
    onSuccess: () => {
      setIsAddingWorkspace(false);
      setNewWorkspaceName('');
      queryClient.invalidateQueries({ queryKey: ['userAccount'] });
      toast.success('Workspace Created', 'New business entity registered.');
    },
    onError: (err: any) => {
      toast.error('Creation Failed', err?.message || 'Could not add workspace');
    },
  });

  if (!isOpen) return null;

  const activeWorkspace = account?.workspaces.find((w) => w.id === account.active_workspace_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-[#1F2937] border border-[#374151] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#374151] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] font-bold text-sm">
              {fullName ? fullName.split(' ').map((n) => n[0]).join('').substring(0, 2) : 'US'}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F9FAFB] flex items-center gap-2">
                <span>Account Profile & Workspaces</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  Verified Entity
                </span>
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                Manage business details, tax identification, and multi-entity review credentials.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151] btn-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Switcher Card */}
        <div className="p-4 rounded-xl bg-[#111827] border border-[#374151] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F9FAFB] uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#10B981]" />
              Active Workspace Entities
            </span>
            <button
              type="button"
              onClick={() => setIsAddingWorkspace(!isAddingWorkspace)}
              className="text-xs text-[#10B981] hover:underline font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              New Entity
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {account?.workspaces.map((ws) => {
              const isActive = ws.id === account.active_workspace_id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => switchWorkspaceMutation.mutate(ws.id)}
                  disabled={switchWorkspaceMutation.isPending}
                  className={`p-3 rounded-lg border text-left btn-transition flex items-center justify-between ${
                    isActive
                      ? 'bg-[#10B981]/15 border-[#10B981] shadow-sm'
                      : 'bg-[#1F2937] border-[#374151] hover:border-[#4B5563]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-[#F9FAFB] truncate">{ws.name}</div>
                    <div className="text-[10px] text-[#9CA3AF] mt-0.5">{ws.type}</div>
                  </div>
                  {isActive && (
                    <span className="w-5 h-5 rounded-full bg-[#10B981] text-black flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* New Workspace Form */}
          {isAddingWorkspace && (
            <div className="p-3 rounded-lg bg-[#1F2937] border border-[#374151] space-y-2.5 mt-2 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-[#F9FAFB]">Add New Business Entity</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Entity Name (e.g. Design Agency LLC)"
                  className="px-2.5 py-1.5 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                />
                <CustomDropdown
                  value={newWorkspaceType}
                  onChange={setNewWorkspaceType}
                  options={workspaceTypeOptions}
                  size="sm"
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingWorkspace(false)}
                  className="px-3 py-1 rounded-md text-xs text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newWorkspaceName.trim() || createWorkspaceMutation.isPending}
                  onClick={() =>
                    createWorkspaceMutation.mutate({
                      name: newWorkspaceName,
                      type: newWorkspaceType,
                    })
                  }
                  className="px-3 py-1 rounded-md bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold disabled:opacity-50"
                >
                  Create & Activate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Business Details Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                Account Signer Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                placeholder="Full Legal Name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                Account Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                placeholder="Email Address"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                Auditor Role / Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                placeholder="e.g. Principal Consultant"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                Legal Business Entity Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
                placeholder="Business Name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                Tax Identification / EIN / GSTIN
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] font-mono focus:outline-none focus:border-[#10B981]"
                placeholder="e.g. EIN-84-2918471"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                Default Home Currency
              </label>
              <CustomDropdown
                value={homeCurrency}
                onChange={setHomeCurrency}
                options={currencyOptions}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              Accountant Handoff Dispatch Email
            </label>
            <input
              type="email"
              value={accountantEmail}
              onChange={(e) => setAccountantEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#374151] text-xs text-[#F9FAFB] focus:outline-none focus:border-[#10B981]"
              placeholder="e.g. tax-accountant@firm.com"
            />
            <p className="text-[11px] text-[#6B7280]">
              Designated certified tax professional who receives verified CSV export packages.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-[#374151] pt-4">
          <span className="text-[11px] text-[#9CA3AF]">
            All updates stored locally in SQLite database.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#283548] text-[#F9FAFB] text-xs font-semibold border border-[#374151] btn-transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  full_name: fullName,
                  email: email,
                  role: role,
                  business_name: businessName,
                  tax_id: taxId,
                  home_currency: homeCurrency,
                  accountant_email: accountantEmail,
                  fiscal_year_start: fiscalYear,
                })
              }
              className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold flex items-center gap-1.5 btn-transition shadow-lg shadow-[#10B981]/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Account Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
