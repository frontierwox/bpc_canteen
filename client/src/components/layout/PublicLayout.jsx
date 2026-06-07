import { Outlet, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Clock, ChefHat } from 'lucide-react';

/* ── Live Clock ──────────────────────────────────────────── */
const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-[11px] text-[#9A7A7A] tabular-nums tracking-tight">
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
    </span>
  );
};

/* ── Navbar ──────────────────────────────────────────────── */
const PublicNavbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${scrolled
        ? 'bg-[rgba(253,250,245,0.97)] backdrop-blur-xl shadow-[0_4px_24px_rgba(123,28,28,0.10)] border-b border-[rgba(123,28,28,0.10)]'
        : 'bg-[rgba(253,250,245,0.85)] backdrop-blur-md border-b border-[rgba(123,28,28,0.06)]'
        }`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* ── Brand ─────────────────────────────────────── */}
        <Link
          to="/menu"
          className="flex items-center gap-3 group flex-shrink-0"
          aria-label="Balaji Perfect Caters – Home"
        >
          {/* Logo circle with maroon ring */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-maroon-400 to-maroon-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-110 blur-sm" />
            <img
              src="/logo.jpeg"
              alt="BPC Logo"
              className="relative w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-full border-[2px] border-[rgba(123,28,28,0.25)] shadow-[0_2px_8px_rgba(123,28,28,0.18)] transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* Text */}
          <div className="leading-none">
            <h1 className="font-display font-bold text-maroon-900 text-[17px] sm:text-[19px] tracking-wide leading-tight group-hover:text-maroon-700 transition-colors duration-200">
              Balaji Perfect Caters
            </h1>
            <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.14em] uppercase text-[#C08000] mt-[1px]">
              Premium Veg &amp; Non-Veg
            </p>
          </div>
        </Link>

        {/* ── Right Side ────────────────────────────────── */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live clock — hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-1.5 bg-maroon-50 border border-[rgba(123,28,28,0.10)] px-2.5 py-1.5 rounded-full">
            <Clock className="w-3 h-3 text-[#9A7A7A]" />
            <LiveClock />
          </div>

          {/* "Dine In" badge */}
          <div className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-maroon-50 to-gold-50 border border-[rgba(212,160,23,0.25)] px-3 py-1.5 rounded-full">
            <ChefHat className="w-3.5 h-3.5 text-maroon-600" />
            <span className="text-[11px] font-semibold text-maroon-700 tracking-wide whitespace-nowrap">
              Dine In
            </span>
          </div>


        </div>
      </div>

      {/* Gold accent line at top (thin) */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[rgba(212,160,23,0.6)] to-transparent pointer-events-none" />
    </header>
  );
};

/* ── Footer ──────────────────────────────────────────────── */
const PublicFooter = () => (
  <footer className="mt-16 border-t border-[rgba(123,28,28,0.08)] bg-[rgba(253,250,245,0.9)] pb-safe relative flex flex-col">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left w-full">
      <div className="flex items-center gap-2.5">
        <img src="/logo.jpeg" alt="BPC" className="w-7 h-7 rounded-full object-cover opacity-80 border border-[rgba(123,28,28,0.15)]" />
        <div>
          <p className="font-display font-semibold text-maroon-900 text-[14px] leading-tight">Balaji Perfect Caters</p>
          <p className="text-[10px] text-[#9A7A7A] tracking-wider uppercase mt-px">Authentic • Fresh • Delicious</p>
        </div>
      </div>
      <p className="text-[11px] text-[#9A7A7A] leading-relaxed max-w-xs">
        Serving quality food with warmth and tradition.
        <br className="hidden sm:inline" /> Every meal crafted with care.
      </p>
      <p className="text-[11px] text-[#C0A080]">© {new Date().getFullYear()} BPC Canteen</p>
    </div>

    {/* Frontier Wox Logo at the bottom perfectly */}
    <div className="border-t border-[rgba(123,28,28,0.08)] bg-gradient-to-b from-[#FDFAF5] to-maroon-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex justify-center items-center">
        <a
          href="https://frontierwox.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 opacity-90 hover:opacity-100 transition-all duration-500"
        >
          <span className="text-[10px] sm:text-[11px] tracking-[0.2em] text-[#9A7A7A] uppercase font-semibold group-hover:text-maroon-700 transition-colors">
            Powered By
          </span>
          <div className="relative flex items-center justify-center p-1">
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-maroon-200 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
            <img
              src="/companylogo.jpeg"
              alt="Frontier Wox"
              className="relative h-9 sm:h-12 w-auto object-contain mix-blend-multiply drop-shadow-sm transition-all duration-500 transform group-hover:scale-105 group-hover:drop-shadow-md"
            />
          </div>
        </a>
      </div>
    </div>
  </footer>
);

/* ── Layout ──────────────────────────────────────────────── */
const PublicLayout = () => (
  <div className="min-h-screen bg-[#FDFAF5] font-body flex flex-col">
    <PublicNavbar />
    <main className="flex-1 pt-2">
      <Outlet />
    </main>
    <PublicFooter />
  </div>
);

export default PublicLayout;
