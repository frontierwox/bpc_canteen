import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { QrCode, Download, Link2, RefreshCw } from 'lucide-react';
import { settingsAPI } from '../../api/settings.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const QRManagement = () => {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['qr'], queryFn: () => settingsAPI.getQR(window.location.origin).then((r) => r.data.data) });

  const downloadQR = () => {
    if (!data?.qrCode) return;
    const link = document.createElement('a');
    link.href = data.qrCode;
    link.download = 'BPC_Menu_QR.png';
    link.click();
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center"><h1 className="page-heading">QR Code for Menu</h1><p className="page-subheading">Scan to view the digital menu</p></div>

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card-bpc p-8 text-center">
        {data?.qrCode && (
          <div className="inline-block p-6 bg-white rounded-2xl border-4 border-bpc-maroon-100 shadow-bpc-lg mb-6">
            <img src={data.qrCode} alt="Menu QR Code" className="w-64 h-64" />
          </div>
        )}
        <p className="text-sm text-gray-500 mb-1">Scan this QR code to open the menu</p>
        <div className="flex items-center justify-center gap-1 text-xs text-bpc-maroon-600 mb-6"><Link2 className="w-3 h-3" /><a href={data?.menuUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{data?.menuUrl}</a></div>
        <div className="flex gap-3 justify-center">
          <button onClick={downloadQR} className="btn-bpc"><Download className="w-4 h-4" /> Download QR</button>
          <button onClick={() => refetch()} className="btn-bpc-outline"><RefreshCw className="w-4 h-4" /> Regenerate</button>
        </div>
      </motion.div>

      <div className="card-bpc p-5">
        <h3 className="font-semibold text-gray-800 mb-3">💡 Tips</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Print and place at each table or counter</li>
          <li>• Include in your visiting cards and brochures</li>
          <li>• The menu updates in real-time when you edit items</li>
          <li>• Works on all smartphones — no app needed</li>
        </ul>
      </div>
    </div>
  );
};

export default QRManagement;
