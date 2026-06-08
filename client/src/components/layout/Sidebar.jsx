import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutDashboard, UtensilsCrossed, Tag, Users, UserCog, Receipt, FileText, BarChart3, QrCode, Settings, PlusCircle, ClipboardList, FileBarChart, MoreHorizontal, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/menu', icon: UtensilsCrossed, label: 'Menu Items' },
  { to: '/admin/categories', icon: Tag, label: 'Categories' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/employees', icon: UserCog, label: 'Employees' },
  { to: '/admin/bills', icon: Receipt, label: 'All Bills' },
  { to: '/admin/invoice-generator', icon: FileText, label: 'Invoice Gen' },
  { to: '/admin/statements', icon: FileText, label: 'Statements' },
  { to: '/admin/qr', icon: QrCode, label: 'QR Code' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const employeeLinks = [
  { to: '/employee', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/employee/create-bill', icon: PlusCircle, label: 'New Bill' },
  { to: '/employee/bills', icon: ClipboardList, label: 'My Bills' },
  { to: '/employee/statements', icon: FileBarChart, label: 'Statements' },
];

/** Maximum number of items to show directly in the bottom bar */
const MAX_BOTTOM_TABS = 4;

const Sidebar = () => {
  const { sidebarOpen, mobileSidebarOpen, closeMobileSidebar } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();
  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  // Bottom nav: split into visible tabs + overflow "More" items
  const visibleBottomLinks = links.slice(0, MAX_BOTTOM_TABS);
  const overflowLinks = links.slice(MAX_BOTTOM_TABS);
  const hasOverflow = overflowLinks.length > 0;

  // "More" dropdown state
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // Check if any overflow link is active (to highlight the "More" tab)
  const isOverflowActive = overflowLinks.some(
    (link) => location.pathname === link.to || (!link.end && location.pathname.startsWith(link.to + '/'))
  );

  // Close "More" dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close "More" dropdown on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-gold-400 flex items-center justify-center bg-maroon-800 text-gold-400 font-display font-bold text-xl shadow-[0_0_16px_rgba(212,160,23,0.3)]">
          B
        </div>
        <div>
          <h1 className="font-display text-[22px] font-bold text-[#FFFDF8] tracking-[0.04em] leading-none">BPC</h1>
          <p className="font-body text-[10px] font-normal text-gold-300 tracking-[0.12em] uppercase mt-1">Balaji Perfect Caters</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <div className="text-[10px] font-medium tracking-[0.14em] uppercase text-white/25 px-5 py-2">Menu</div>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} onClick={closeMobileSidebar}
            className={({ isActive }) => `flex items-center gap-3 px-5 py-2.5 mx-2 rounded-md font-body text-[13.5px] transition-all duration-220 ease-smooth border-l-[3px] ${isActive ? 'bg-gold-400/10 text-gold-300 border-gold-400 font-medium' : 'text-white/55 border-transparent hover:bg-white/5 hover:text-white/85'}`}>
            {({ isActive }) => (
              <>
                <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'opacity-100 text-gold-400' : 'opacity-70'}`} />
                <span>{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gold-500/30 border border-gold-400/50 flex items-center justify-center text-gold-300 font-semibold text-xs">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 truncate">{user?.name || 'User'}</p>
          <p className="text-[10px] text-gold-300 capitalize">{user?.role}</p>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] bg-maroon-900 border-r border-[rgba(255,255,255,0.05)] min-h-screen flex-shrink-0 fixed left-0 top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay — triggered by burger menu button */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-[#1A0505]/60 backdrop-blur-sm z-[110]"
              onClick={closeMobileSidebar}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.aside
              key="mobile-sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-maroon-900 z-[120] flex flex-col shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={closeMobileSidebar}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
                id="mobile-sidebar-close"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-maroon-900 border-t border-[rgba(255,255,255,0.08)] z-[90] pb-[env(safe-area-inset-bottom)] flex justify-around items-center px-2" id="mobile-bottom-nav">
        {visibleBottomLinks.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}
            className={({ isActive }) => `flex flex-col items-center justify-center gap-[3px] w-full h-full transition-colors duration-200 ${isActive ? 'text-gold-400' : 'text-white/40'}`}>
            <link.icon className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-medium tracking-[0.04em]">{link.label}</span>
          </NavLink>
        ))}

        {/* "More" tab with dropdown — only if there are overflow links */}
        {hasOverflow && (
          <div className="relative flex flex-col items-center justify-center w-full h-full" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((prev) => !prev)}
              className={`flex flex-col items-center justify-center gap-[3px] w-full h-full transition-colors duration-200 ${
                isOverflowActive || moreOpen ? 'text-gold-400' : 'text-white/40'
              }`}
              id="bottom-nav-more-btn"
              aria-expanded={moreOpen}
              aria-label="More navigation options"
            >
              <MoreHorizontal className="w-[22px] h-[22px]" />
              <span className="text-[10px] font-medium tracking-[0.04em]">More</span>
            </button>

            {/* Overflow dropdown */}
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="absolute bottom-full right-0 mb-2 w-56 bg-maroon-800 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] py-2 overflow-hidden"
                  id="bottom-nav-more-dropdown"
                >
                  <div className="text-[9px] font-medium tracking-[0.14em] uppercase text-white/25 px-4 py-1.5">More Options</div>
                  {overflowLinks.map((link) => {
                    const isActive = location.pathname === link.to || (!link.end && location.pathname.startsWith(link.to + '/'));
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-[13px] font-medium transition-colors duration-150 ${
                          isActive
                            ? 'bg-gold-400/10 text-gold-300'
                            : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                        }`}
                      >
                        <link.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-gold-400' : 'opacity-60'}`} />
                        <span>{link.label}</span>
                      </NavLink>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Floating "New Bill" FAB for employees */}
        {user?.role === 'employee' && (
          <NavLink to="/employee/create-bill" className="fixed bottom-[80px] right-5 w-14 h-14 rounded-full bg-maroon-600 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(123,28,28,0.5)] z-[91] hover:scale-105 hover:shadow-[0_6px_24px_rgba(123,28,28,0.6)] transition-all">
            <PlusCircle className="w-6 h-6" />
          </NavLink>
        )}
      </nav>
    </>
  );
};

export default Sidebar;
