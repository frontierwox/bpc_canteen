import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/auth.api';

const schema = z.object({ email: z.string().email('Please enter a valid email') });

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await authAPI.forgotPassword(data);
      setSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="min-h-screen bg-bpc-cream flex items-center justify-center p-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md">
        <div className="card-bpc p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm">If this email is registered, you'll receive a password reset link.</p>
              <Link to="/login" className="btn-bpc mt-6 inline-flex">Back to Login</Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-1 text-sm text-bpc-maroon-600 hover:text-bpc-maroon-800 mb-6"><ArrowLeft className="w-4 h-4" /> Back to Login</Link>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input {...register('email')} type="email" placeholder="your@email.com" className="input-bpc" autoFocus />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-bpc w-full justify-center py-3">
                  <Mail className="w-4 h-4" /> Send Reset Link
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
