import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import EmployeeLayout from './components/layout/EmployeeLayout';
import PublicLayout from './components/layout/PublicLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPassword from './pages/auth/ForgotPassword';

// Public Pages
import MenuPage from './pages/public/MenuPage';
import NotFound from './pages/public/NotFound';

// Admin Pages — lazy loaded for code splitting
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const MenuManagement = lazy(() => import('./pages/admin/MenuManagement'));
const CustomerManagement = lazy(() => import('./pages/admin/CustomerManagement'));
const AllBills = lazy(() => import('./pages/admin/AllBills'));
const MonthlyStatements = lazy(() => import('./pages/admin/MonthlyStatements'));
const CustomerStatement = lazy(() => import('./pages/admin/CustomerStatement'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const QRManagement = lazy(() => import('./pages/admin/QRManagement'));
const EmployeeManagement = lazy(() => import('./pages/admin/EmployeeManagement'));
const BillDetail = lazy(() => import('./pages/admin/BillDetail'));

// Employee Pages
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const CreateBill = lazy(() => import('./pages/employee/CreateBill'));
const MyBills = lazy(() => import('./pages/employee/MyBills'));

const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<LoadingSpinner text="Loading page..." />}>{children}</Suspense>
);

const App = () => {
  const { checkAuth, isLoading, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) return <LoadingSpinner fullScreen text="Initializing BPC Canteen..." />;

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/menu" element={<MenuPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/admin' : '/employee'} /> : <LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<SuspenseWrapper><AdminDashboard /></SuspenseWrapper>} />
          <Route path="menu" element={<SuspenseWrapper><MenuManagement /></SuspenseWrapper>} />
          <Route path="customers" element={<SuspenseWrapper><CustomerManagement /></SuspenseWrapper>} />
          <Route path="employees" element={<SuspenseWrapper><EmployeeManagement /></SuspenseWrapper>} />
          <Route path="bills" element={<SuspenseWrapper><AllBills /></SuspenseWrapper>} />
          <Route path="bills/:id" element={<SuspenseWrapper><BillDetail /></SuspenseWrapper>} />
          <Route path="statements" element={<SuspenseWrapper><MonthlyStatements /></SuspenseWrapper>} />
          <Route path="statements/:id" element={<SuspenseWrapper><CustomerStatement /></SuspenseWrapper>} />
          <Route path="analytics" element={<SuspenseWrapper><AdminDashboard /></SuspenseWrapper>} />
          <Route path="qr" element={<SuspenseWrapper><QRManagement /></SuspenseWrapper>} />
          <Route path="settings" element={<SuspenseWrapper><SettingsPage /></SuspenseWrapper>} />
        </Route>

        {/* Employee Routes */}
        <Route path="/employee" element={<ProtectedRoute roles={['employee', 'admin']}><EmployeeLayout /></ProtectedRoute>}>
          <Route index element={<SuspenseWrapper><EmployeeDashboard /></SuspenseWrapper>} />
          <Route path="create-bill" element={<SuspenseWrapper><CreateBill /></SuspenseWrapper>} />
          <Route path="bills" element={<SuspenseWrapper><MyBills /></SuspenseWrapper>} />
          <Route path="statements" element={<SuspenseWrapper><MonthlyStatements /></SuspenseWrapper>} />
          <Route path="statements/:id" element={<SuspenseWrapper><CustomerStatement /></SuspenseWrapper>} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/admin' : '/employee'} /> : <Navigate to="/login" />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
