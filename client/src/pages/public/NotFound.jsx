import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen bg-bpc-cream flex items-center justify-center p-6">
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
      <div className="text-8xl font-display font-bold text-bpc-maroon-200 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-bpc"><Home className="w-4 h-4" /> Go Home</Link>
    </motion.div>
  </div>
);

export default NotFound;
