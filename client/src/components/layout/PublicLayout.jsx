import { Outlet, Link } from 'react-router-dom';

const PublicLayout = () => (
  <div className="min-h-screen bg-bpc-cream">
    <header className="gradient-maroon py-4 px-4 shadow-lg">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/menu" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-bpc-gold-500 flex items-center justify-center text-white font-bold">B</div>
          <div>
            <h1 className="text-white font-display text-xl font-bold tracking-wide">Balaji Perfect Caters</h1>
            <p className="text-bpc-gold-300 text-xs">High Class Veg & Non Veg Caterers</p>
          </div>
        </Link>
        <Link to="/login" className="text-sm text-bpc-gold-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/10">Staff Login</Link>
      </div>
    </header>
    <main><Outlet /></main>
  </div>
);

export default PublicLayout;
