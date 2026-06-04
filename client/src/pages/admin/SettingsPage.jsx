import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Upload, Building2, CreditCard, FileText, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../api/settings.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsAPI.get().then((r) => r.data.data) });
  const [fd, setFd] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const updateMut = useMutation({ mutationFn: (data) => settingsAPI.update(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings saved!'); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
  const logoMut = useMutation({ mutationFn: (formData) => settingsAPI.uploadLogo(formData), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); setLogoFile(null); toast.success('Logo uploaded!'); }, onError: (e) => toast.error(e.response?.data?.message || 'Upload failed') });

  if (isLoading) return <LoadingSpinner />;
  const s = fd || data || {};
  const update = (key, val) => setFd({ ...s, [key]: val });

  const handleSave = () => {
    updateMut.mutate({
      businessName: s.businessName, tagline: s.tagline, gstin: s.gstin, fssai: s.fssai,
      address: s.address, phone1: s.phone1, phone2: s.phone2, email: s.email,
      defaultTaxRate: s.defaultTaxRate, invoicePrefix: s.invoicePrefix,
      bankDetails: s.bankDetails,
    });
  };

  const handleLogoUpload = () => {
    if (!logoFile) return;
    const formData = new FormData();
    formData.append('logo', logoFile);
    logoMut.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-body pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-maroon-800 tracking-tight">Settings</h1>
          <p className="text-sm text-[#9A7A7A] mt-1">Configure your business details and preferences</p>
        </div>
        <button onClick={handleSave} disabled={updateMut.isPending} className="btn-primary shadow-[0_4px_16px_rgba(123,28,28,0.2)] px-6">
          <Save className="w-4 h-4 mr-1.5" />
          {updateMut.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Business Info */}
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] flex items-center gap-3 bg-maroon-50/30">
              <div className="w-10 h-10 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A0505] font-display">Business Information</h2>
                <p className="text-[12px] text-[#9A7A7A]">General details for invoices and app shell</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="form-label">Business Name</label><input value={s.businessName || ''} onChange={(e) => update('businessName', e.target.value)} className="form-input" /></div>
                <div><label className="form-label">Tagline</label><input value={s.tagline || ''} onChange={(e) => update('tagline', e.target.value)} className="form-input" /></div>
                <div><label className="form-label">GSTIN</label><input value={s.gstin || ''} onChange={(e) => update('gstin', e.target.value)} className="form-input font-mono text-[13px]" /></div>
                <div><label className="form-label">FSSAI</label><input value={s.fssai || ''} onChange={(e) => update('fssai', e.target.value)} className="form-input font-mono text-[13px]" /></div>
                <div className="md:col-span-2"><label className="form-label">Address</label><textarea value={s.address || ''} onChange={(e) => update('address', e.target.value)} className="form-input resize-none" rows={2} /></div>
                <div><label className="form-label">Phone 1</label><input value={s.phone1 || ''} onChange={(e) => update('phone1', e.target.value)} className="form-input font-mono text-[13px]" /></div>
                <div><label className="form-label">Phone 2</label><input value={s.phone2 || ''} onChange={(e) => update('phone2', e.target.value)} className="form-input font-mono text-[13px]" /></div>
                <div className="md:col-span-2"><label className="form-label">Email</label><input value={s.email || ''} onChange={(e) => update('email', e.target.value)} className="form-input" /></div>
              </div>
            </div>
          </motion.div>

          {/* Bank Details */}
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] flex items-center gap-3 bg-maroon-50/30">
              <div className="w-10 h-10 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-700">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A0505] font-display">Bank Details</h2>
                <p className="text-[12px] text-[#9A7A7A]">For monthly statements and invoices</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="form-label">Vendor Name</label><input value={s.bankDetails?.vendorName || ''} onChange={(e) => update('bankDetails', { ...s.bankDetails, vendorName: e.target.value })} className="form-input" /></div>
                <div><label className="form-label">Bank Name</label><input value={s.bankDetails?.bankName || ''} onChange={(e) => update('bankDetails', { ...s.bankDetails, bankName: e.target.value })} className="form-input" /></div>
                <div><label className="form-label">Branch</label><input value={s.bankDetails?.branch || ''} onChange={(e) => update('bankDetails', { ...s.bankDetails, branch: e.target.value })} className="form-input" /></div>
                <div><label className="form-label">IFSC Code</label><input value={s.bankDetails?.ifscCode || ''} onChange={(e) => update('bankDetails', { ...s.bankDetails, ifscCode: e.target.value })} className="form-input font-mono text-[13px] uppercase" /></div>
                <div className="md:col-span-2"><label className="form-label">Account Number</label><input value={s.bankDetails?.accountNumber || ''} onChange={(e) => update('bankDetails', { ...s.bankDetails, accountNumber: e.target.value })} className="form-input font-mono text-[13px]" /></div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          {/* Logo Upload */}
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] flex items-center gap-3 bg-maroon-50/30">
              <div className="w-10 h-10 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-700">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#1A0505] font-display">Brand Logo</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center gap-5">
                {s.logoUrl ? (
                  <div className="w-32 h-32 rounded-xl border border-[rgba(123,28,28,0.08)] p-2 bg-surface-page shadow-sm">
                    <img src={s.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl border border-dashed border-[rgba(123,28,28,0.15)] bg-maroon-50/30 flex flex-col items-center justify-center text-maroon-300">
                    <Globe className="w-8 h-8 mb-2" />
                    <span className="text-[11px]">No logo set</span>
                  </div>
                )}
                
                <div className="w-full">
                  <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[rgba(123,28,28,0.15)] bg-maroon-50/30 rounded-xl cursor-pointer hover:border-maroon-300 hover:bg-maroon-50 transition-colors">
                    <Upload className="w-5 h-5 text-maroon-600" />
                    <span className="text-[13px] font-medium text-[#5A3A3A]">{logoFile ? logoFile.name : 'Choose new logo'}</span>
                    <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="hidden" />
                  </label>
                  {logoFile && (
                    <button onClick={handleLogoUpload} disabled={logoMut.isPending} className="w-full mt-3 py-2 bg-surface-card border border-maroon-200 text-maroon-700 font-medium text-[13px] rounded-lg hover:bg-maroon-50 transition-colors shadow-sm">
                      {logoMut.isPending ? 'Uploading...' : 'Upload Logo'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Invoice Settings */}
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-surface-card rounded-2xl border border-[rgba(123,28,28,0.08)] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[rgba(123,28,28,0.08)] flex items-center gap-3 bg-maroon-50/30">
              <div className="w-10 h-10 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-700">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#1A0505] font-display">Invoice Settings</h2>
            </div>
            <div className="p-6 space-y-5">
              <div><label className="form-label">Default Tax Rate (%)</label><input type="number" step="0.01" value={s.defaultTaxRate ?? 0} onChange={(e) => update('defaultTaxRate', e.target.value)} className="form-input w-full" /></div>
              <div><label className="form-label">Invoice Prefix</label><input value={s.invoicePrefix || ''} onChange={(e) => update('invoicePrefix', e.target.value)} className="form-input w-full" /></div>
              <div>
                <label className="form-label flex items-center gap-2">Current Counter <span className="text-[10px] bg-info-bg text-info-text px-1.5 py-0.5 rounded uppercase">Auto-increments</span></label>
                <input value={s.invoiceCounter || ''} disabled className="form-input w-full bg-surface-page text-[#9A7A7A] cursor-not-allowed" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
