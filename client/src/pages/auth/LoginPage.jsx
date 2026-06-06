import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((s) => s.login);
  const expired = searchParams.get('expired');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await login(data);
      const role = res.data.user.role;
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(role === 'admin' ? '/admin' : '/employee');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col lg:grid lg:grid-cols-[45%_55%] font-body">
      {/* Left Panel — Branding */}
      <div className="bg-maroon-900 relative overflow-hidden flex flex-col items-center justify-center p-10 lg:p-16">
        {/* Diagonal line pattern overlay */}
        <div className="absolute inset-0 bg-diagonal-gold pointer-events-none" />
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative z-10 flex flex-col items-center">
          <div className="w-[100px] h-[100px] rounded-full border-[3px] border-[rgba(212,160,23,0.5)] shadow-[0_0_40px_rgba(212,160,23,0.25)] flex items-center justify-center bg-maroon-800 mb-7 overflow-hidden">
            <img src="/logo.jpeg" alt="Balaji Perfect Caters" className="w-full h-full object-cover" />
          </div>
          
          <h1 className="font-display text-[44px] font-bold text-[#FFF8F8] text-center tracking-[0.03em] leading-[1.1]">
            BALAJI PERFECT<br/>CATERS
          </h1>
          
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-gold-400 to-transparent my-5" />
          
          <p className="font-body text-[11px] font-normal tracking-[0.20em] uppercase text-gold-300 text-center">
            High Class Veg & Non Veg Caterers
          </p>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 bg-surface-page flex flex-col items-center justify-center p-8 lg:p-16">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-[400px]">
          <h2 className="font-display text-[34px] font-semibold text-maroon-600 mb-1.5">Welcome back</h2>
          <p className="text-[14px] text-[#9A7A7A] mb-9">Sign in to your account to continue</p>

          {expired && (
            <div className="flex items-center gap-2 p-3 bg-warning-bg border border-warning-border rounded-md mb-5 text-sm text-warning-text">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> Session expired. Please log in again.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label">Email Address</label>
              <input {...register('email')} type="email" placeholder="admin@bpc.com" className={`form-input ${errors.email ? 'error' : ''}`} id="login-email" autoFocus />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className={`form-input pr-10 ${errors.password ? 'error' : ''}`} id="login-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A7A7A] hover:text-[#5A3A3A]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end pb-2">
              <a href="/forgot-password" className="text-xs text-[#9A7A7A] hover:text-maroon-600 font-medium transition-colors">Forgot password?</a>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full" id="login-submit">
              {isSubmitting ? <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} /> : 'SIGN IN'}
            </button>
          </form>

          <p className="text-center text-xs text-[#9A7A7A]/60 mt-8">© {new Date().getFullYear()} Balaji Perfect Caters.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
