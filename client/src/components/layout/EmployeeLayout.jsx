import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';

const EmployeeLayout = () => (
  <div className="min-h-screen bg-surface-page flex flex-col">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <ErrorBoundary><Outlet /></ErrorBoundary>
      </main>
    </div>
  </div>
);

export default EmployeeLayout;
