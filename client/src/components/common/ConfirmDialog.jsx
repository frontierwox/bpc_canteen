import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Reusable confirmation dialog with BPC styling.
 */
const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger', loading = false }) => {
  if (!open) return null;

  const variants = {
    danger: { bg: 'bg-red-100', icon: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
    warning: { bg: 'bg-amber-100', icon: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700' },
    info: { bg: 'bg-bpc-maroon-100', icon: 'text-bpc-maroon-700', btn: 'bg-bpc-maroon-700 hover:bg-bpc-maroon-800' },
  };

  const v = variants[variant] || variants.danger;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 ${v.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className={`w-6 h-6 ${v.icon}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${v.btn}`}>
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;
