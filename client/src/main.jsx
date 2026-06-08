import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

/**
 * Global error handler for mutations — surfaces server error messages
 * as toast notifications without requiring each component to handle
 * errors individually. Queries are NOT included here because failed
 * GETs should be handled locally (e.g., showing an empty-state UI).
 *
 * Individual mutations can suppress this by setting `meta: { silent: true }`.
 */
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    // Allow individual mutations to suppress global toasts
    if (mutation.options.meta?.silent) return;

    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong. Please try again.';

    toast.error(message, { id: `mutation-error-${Date.now()}` });
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', background: '#1A1A1A', color: '#fff', fontSize: '14px' },
            success: { iconTheme: { primary: '#2D7A3A', secondary: '#fff' } },
            error: { iconTheme: { primary: '#C0392B', secondary: '#fff' } },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
