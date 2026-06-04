import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

/**
 * Custom hook for authentication state and actions.
 */
export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    login,
    logout,
    checkAuth,
  };
};

export default useAuth;
