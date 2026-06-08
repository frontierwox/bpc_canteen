import { create } from 'zustand';
import { authAPI } from '../api/auth.api';
import { setAccessToken, clearAccessToken } from '../api/axios.instance';

/**
 * Zustand authentication store.
 *
 * Token strategy:
 *  - Access token: stored in memory only (via axios.instance helpers).
 *    Not in localStorage — mitigates XSS token theft.
 *  - Refresh token: httpOnly cookie managed by the server.
 *    Never accessible to JavaScript.
 *
 * On a page refresh, checkAuth() calls getMe(). If the access token is gone
 * from memory, the axios interceptor fires the refresh-token endpoint using
 * the httpOnly cookie and silently retries — so a single getMe() call is all
 * that is needed here.
 */
const useAuthStore = create((set) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,

  /**
   * Authenticates the user with email + password.
   * Stores the returned access token in memory via setAccessToken().
   *
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise} Resolves with the full API response
   */
  login: async (credentials) => {
    const { data } = await authAPI.login(credentials);
    const { user, accessToken } = data.data;

    setAccessToken(accessToken);
    set({ user, isAuthenticated: true, isLoading: false });

    return data;
  },

  /**
   * Logs the user out by calling the server (invalidates the refresh token),
   * then clears in-memory state.
   * Continues even if the API call fails (e.g., already expired token).
   */
  logout: async () => {
    try {
      await authAPI.logout();
    } catch {
      // Proceed with local logout regardless of API response
    }
    clearAccessToken();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  /**
   * Verifies authentication status on application load.
   *
   * A single getMe() call is sufficient — the axios response interceptor
   * transparently handles 401 → refresh-token → retry. We do NOT manually
   * attempt a refresh here to avoid race conditions with the interceptor.
   */
  checkAuth: async () => {
    try {
      const { data } = await authAPI.getMe();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      // Session is definitively expired — the interceptor already tried refresh
      clearAccessToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Updates the user object in the store (e.g., after a profile edit).
   * @param {Object} user - Updated user data
   */
  setUser: (user) => set({ user }),
}));

export default useAuthStore;
