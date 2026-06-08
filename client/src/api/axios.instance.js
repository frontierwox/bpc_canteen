import axios from 'axios';

// ─── Base URL Resolution ──────────────────────────────────────────────────────
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Auto-correct if the developer forgot to include /api/v1 in their env var
if (API_BASE_URL.startsWith('http') && !API_BASE_URL.includes('/api/v1')) {
  API_BASE_URL = `${API_BASE_URL.replace(/\/$/, '')}/api/v1`;
}

// ─── In-Memory Token Store ────────────────────────────────────────────────────
// The access token is kept in a module-level variable (memory).
// This is safer than localStorage because it is NOT accessible to injected
// third-party scripts (XSS mitigation). The value persists across renders
// within a single tab session. A page refresh triggers checkAuth(), which
// uses the httpOnly refresh-token cookie to silently obtain a new access token.
let _accessToken = null;

/**
 * Reads the access token from the in-memory store.
 * Falls back to localStorage for backward compatibility during migration.
 * @returns {string|null}
 */
export const getAccessToken = () => {
  if (_accessToken) return _accessToken;
  // Fallback: migrate existing localStorage token to memory on first access
  const stored = localStorage.getItem('bpc_access_token');
  if (stored) {
    _accessToken = stored;
    localStorage.removeItem('bpc_access_token'); // clear from storage
  }
  return _accessToken;
};

/**
 * Stores the access token in memory only.
 * @param {string|null} token
 */
export const setAccessToken = (token) => {
  _accessToken = token;
  // Keep localStorage clear — tokens should not persist in storage
  localStorage.removeItem('bpc_access_token');
};

/**
 * Clears the in-memory access token.
 */
export const clearAccessToken = () => {
  _accessToken = null;
  localStorage.removeItem('bpc_access_token');
};

// ─── Axios Instance ───────────────────────────────────────────────────────────

/**
 * Configured Axios instance for all BPC Canteen API calls.
 *
 * Features:
 *  - withCredentials: sends the httpOnly refresh-token cookie automatically
 *  - Request interceptor: attaches in-memory access token as Bearer header
 *  - Response interceptor: silently refreshes on 401 and retries the request
 *  - Queue: concurrent 401s are queued and replayed after one refresh attempt
 */
const api = axios.create({
  baseURL:         API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Refresh-Queue State ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else       prom.resolve(token);
  });
  failedQueue = [];
};

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Never attempt refresh for auth endpoints — would cause infinite loops
      if (
        originalRequest.url?.includes('/auth/refresh-token') ||
        originalRequest.url?.includes('/auth/login')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until the current refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing           = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth state and redirect — session is definitively expired
        clearAccessToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
