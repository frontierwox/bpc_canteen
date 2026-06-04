import { create } from 'zustand';
import { authAPI } from '../api/auth.api';

/**
 * Zustand auth store — manages authentication state.
 * Access token in memory (localStorage), refresh token in httpOnly cookie.
 */
const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Login with email/password. Stores token and user data.
   */
  login: async (credentials) => {
    const { data } = await authAPI.login(credentials);
    const { user, accessToken } = data.data;
    localStorage.setItem('bpc_access_token', accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
    return data;
  },

  /**
   * Logout — clears token and user data.
   */
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue logout even if API fails
      console.error('Logout API error:', error);
    }
    localStorage.removeItem('bpc_access_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  /**
   * Check authentication status on app load.
   * Tries to fetch current user with existing token.
   */
  checkAuth: async () => {
    const token = localStorage.getItem('bpc_access_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const { data } = await authAPI.getMe();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      // Try refresh
      try {
        const { data: refreshData } = await authAPI.refreshToken();
        localStorage.setItem('bpc_access_token', refreshData.data.accessToken);
        const { data } = await authAPI.getMe();
        set({ user: data.data, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem('bpc_access_token');
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },

  /**
   * Update user data in store (after profile edit).
   */
  setUser: (user) => set({ user }),
}));

export default useAuthStore;
