import { Link, useLocation } from 'react-router-dom';
import { Menu, LogOut, User, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { toggleMobileSidebar } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-40 h-16 bg-[rgba(255,253,248,0.92)] backdrop-blur-md border-b border-[rgba(123,28,28,0.08)] flex items-center justify-between px-4 lg:px-8 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={toggleMobileSidebar} className="md:hidden text-maroon-800 hover:text-maroon-600 p-1.5 rounded-lg hover:bg-maroon-50 transition-colors" id="mobile-menu-toggle">
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Mobile Logo */}
        <Link to={user?.role === 'admin' ? '/admin' : '/employee'} className="md:hidden flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full border border-gold-400 bg-maroon-800 flex items-center justify-center text-gold-400 font-bold text-sm">B</div>
        </Link>

        {/* Desktop Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 font-body text-[13px] text-[#9A7A7A]">
          <span className="capitalize">{user?.role || 'Home'}</span>
          {pathSegments.slice(1).map((segment, index) => {
            const isObjectId = /^[a-f0-9]{24}$/i.test(segment);
            let label;

            if (isObjectId) {
              // Map parent route to a meaningful detail label
              const parentSegment = pathSegments[index + 1 - 1] || '';
              const detailLabels = {
                statements: 'Statement Details',
                bills: 'Bill Details',
                customers: 'Customer Details',
                employees: 'Employee Details',
                menu: 'Item Details',
              };
              label = detailLabels[parentSegment] || 'Details';
            } else {
              label = segment.replace(/-/g, ' ');
            }

            return (
              <span key={segment} className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5" />
                <span className={`capitalize ${index === pathSegments.length - 2 ? 'text-[#1A0505] font-medium' : ''}`}>
                  {label}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center px-2.5 py-1 bg-surface-page border border-[rgba(123,28,28,0.08)] rounded-md">
          <span className="font-mono text-xs text-[#9A7A7A]">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 text-maroon-900 hover:text-maroon-700 pl-3 pr-2 py-1.5 rounded-lg hover:bg-maroon-50 transition-colors" id="user-menu-btn">
            <div className="w-8 h-8 rounded-full bg-maroon-50 border border-maroon-200 flex items-center justify-center text-maroon-600 font-semibold text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-[#9A7A7A] capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#9A7A7A]" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_8px_32px_rgba(123,28,28,0.14)] border border-[rgba(123,28,28,0.08)] py-2 animate-fade-in">
              <div className="px-4 py-2 border-b border-[rgba(123,28,28,0.08)]">
                <p className="text-sm font-semibold text-[#1A0505]">{user?.name}</p>
                <p className="text-xs text-[#9A7A7A]">{user?.email}</p>
              </div>
              <Link to={user?.role === 'admin' ? '/admin/settings' : '/employee'} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#5A3A3A] hover:bg-maroon-50 transition-colors">
                <User className="w-4 h-4" /> Profile
              </Link>
              <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors" id="logout-btn">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
