import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Leaf, Flame, Star, X, PartyPopper,
  Utensils, Coffee, Pizza, Croissant, Soup, IceCream,
  UtensilsCrossed, CupSoda, Beef, CakeSlice, Salad,
  Sandwich, Popcorn, Wine, SlidersHorizontal, ChevronDown,
} from 'lucide-react';
import { usePublicMenu, useCategories } from '../../hooks/useMenu';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatINR } from '../../utils/currency.utils';

/* ─────────────────────────────────────────────────────────
   Category icon resolver
──────────────────────────────────────────────────────── */
const getCategoryIcon = (catName, size = 'w-4 h-4') => {
  if (!catName) return <Utensils className={size} />;
  const name = catName.toLowerCase();
  if (name.includes('breakfast') || name.includes('morning')) return <Croissant className={size} />;
  if (name.includes('lunch') || name.includes('meal') || name.includes('thali')) return <UtensilsCrossed className={size} />;
  if (name.includes('dinner')) return <Utensils className={size} />;
  if (name.includes('coffee') || name.includes('tea')) return <Coffee className={size} />;
  if (name.includes('drink') || name.includes('beverage') || name.includes('juice')) return <CupSoda className={size} />;
  if (name.includes('pizza') || name.includes('italian')) return <Pizza className={size} />;
  if (name.includes('soup')) return <Soup className={size} />;
  if (name.includes('dessert') || name.includes('sweet') || name.includes('ice cream')) return <IceCream className={size} />;
  if (name.includes('sandwich') || name.includes('burger') || name.includes('fast food')) return <Sandwich className={size} />;
  if (name.includes('salad') || name.includes('healthy') || name.includes('veg')) return <Salad className={size} />;
  if (name.includes('starter') || name.includes('snack') || name.includes('bite')) return <Popcorn className={size} />;
  if (name.includes('non veg') || name.includes('chicken') || name.includes('meat') || name.includes('mutton') || name.includes('beef')) return <Beef className={size} />;
  if (name.includes('cake') || name.includes('bakery')) return <CakeSlice className={size} />;
  if (name.includes('wine') || name.includes('alcohol')) return <Wine className={size} />;
  return <Utensils className={size} />;
};

/* ─────────────────────────────────────────────────────────
   Veg / Non-Veg dot indicator (FSSAI standard)
──────────────────────────────────────────────────────── */
const VegDot = ({ isVeg }) => (
  <div
    className={`w-4 h-4 rounded-sm border-[1.5px] flex items-center justify-center flex-shrink-0 ${
      isVeg ? 'border-[#2D7A3A] bg-white' : 'border-[#E53935] bg-white'
    }`}
    title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
  >
    <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-[#2D7A3A]' : 'bg-[#E53935]'}`} />
  </div>
);

/* ─────────────────────────────────────────────────────────
   Discount badge
──────────────────────────────────────────────────────── */
const DiscountBadge = ({ base, effective }) => {
  if (!base || base <= effective) return null;
  const pct = Math.round(((base - effective) / base) * 100);
  return (
    <span className="text-[9px] font-bold tracking-wider text-white bg-gradient-to-r from-maroon-600 to-maroon-500 px-1.5 py-0.5 rounded-full shadow-sm">
      -{pct}%
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   Menu Item Card
──────────────────────────────────────────────────────── */
const MenuCard = ({ item, index }) => (
  <motion.article
    key={item._id}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.5) }}
    className={`group relative bg-white rounded-2xl border border-[rgba(123,28,28,0.07)] flex flex-col overflow-hidden
      transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(123,28,28,0.13)]
      hover:border-[rgba(123,28,28,0.18)]
      ${!item.isAvailable ? 'opacity-60' : ''}`}
  >
    {/* ── Image ── */}
    <div className="relative h-44 bg-gradient-to-br from-maroon-50 to-gold-50 overflow-hidden flex-shrink-0">
      {item.image?.url ? (
        <img
          src={item.image.url}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
          <div className="w-14 h-14 rounded-full bg-maroon-100 flex items-center justify-center">
            <Utensils className="w-6 h-6 text-maroon-300" />
          </div>
          <span className="text-[10px] font-semibold tracking-widest text-maroon-200 uppercase">BPC</span>
        </div>
      )}

      {/* Subtle gradient overlay at bottom for legibility */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

      {/* Veg indicator — top left */}
      <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
        <VegDot isVeg={item.isVeg} />
      </div>

      {/* Special label — top right */}
      {item.hasSpecialPrice && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-gradient-to-r from-[#D4A017] to-[#C08000] text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-full shadow-md">
          <Star className="w-2.5 h-2.5" />
          {item.specialPrice?.label || 'Special'}
        </div>
      )}

      {/* Sold out overlay */}
      {!item.isAvailable && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
          <span className="bg-[#1A0505] text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
            Sold Out
          </span>
        </div>
      )}
    </div>

    {/* ── Details ── */}
    <div className="p-4 flex-1 flex flex-col">
      <h3 className="font-semibold text-[#1A0505] text-[15px] leading-snug mb-1 line-clamp-2">
        {item.name}
      </h3>
      {item.description && (
        <p className="text-[12px] text-[#9A7A7A] leading-relaxed line-clamp-2 flex-1 mb-3">
          {item.description}
        </p>
      )}
      {!item.description && <div className="flex-1 min-h-[8px]" />}

      {/* Price row */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[rgba(123,28,28,0.05)]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[17px] font-bold text-maroon-700 leading-none">
            {formatINR(item.effectivePrice)}
          </span>
          {item.hasSpecialPrice && (
            <>
              <span className="text-[12px] text-[#9A7A7A] line-through leading-none">
                {formatINR(item.basePrice)}
              </span>
              <DiscountBadge base={item.basePrice} effective={item.effectivePrice} />
            </>
          )}
        </div>
        <span className="text-[10px] font-medium text-[#9A7A7A] uppercase tracking-wider bg-maroon-50 px-2 py-1 rounded-md border border-[rgba(123,28,28,0.06)]">
          {item.unit}
        </span>
      </div>
    </div>
  </motion.article>
);

/* ─────────────────────────────────────────────────────────
   Special Today – Horizontal Scroll Strip
──────────────────────────────────────────────────────── */
const SpecialStrip = ({ items }) => {
  if (!items.length) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-10"
    >
      {/* Section heading */}
      <div className="flex items-center gap-2.5 mb-4 px-0.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 shadow-sm flex-shrink-0">
          <Star className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="font-display text-[20px] sm:text-[22px] font-bold text-maroon-900 leading-tight tracking-tight">
            Today's Specials
          </h2>
          <p className="text-[11px] text-[#9A7A7A] tracking-wider">Exclusive offers · Limited time</p>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory">
        {items.map((item, i) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex-shrink-0 snap-start w-[260px] sm:w-72 bg-white border border-[rgba(212,160,23,0.28)]
              rounded-2xl p-4 shadow-[0_4px_20px_rgba(212,160,23,0.09)] relative overflow-hidden
              hover:shadow-[0_8px_32px_rgba(212,160,23,0.18)] hover:-translate-y-1 transition-all duration-300"
          >
            {/* Gold shimmer corner */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[rgba(212,160,23,0.18)] to-transparent rounded-bl-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-[rgba(212,160,23,0.08)] to-transparent rounded-tr-full pointer-events-none" />

            <div className="flex gap-3 relative z-10">
              {/* Thumbnail */}
              <div className="w-[60px] h-[60px] rounded-xl overflow-hidden bg-maroon-50 flex-shrink-0 border border-[rgba(123,28,28,0.08)]">
                {item.image?.url ? (
                  <img src={item.image.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-maroon-300 font-display font-bold text-lg">B</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <VegDot isVeg={item.isVeg} />
                  <span className="text-[9px] font-bold tracking-widest uppercase text-gold-600 bg-gold-50 border border-gold-200 px-1.5 py-0.5 rounded-full truncate">
                    {item.specialPrice?.label || 'Special'}
                  </span>
                </div>
                <h3 className="font-semibold text-[#1A0505] text-[14px] leading-snug truncate">
                  {item.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[15px] font-bold text-maroon-700">{formatINR(item.effectivePrice)}</span>
                  <span className="text-[11px] text-[#9A7A7A] line-through">{formatINR(item.basePrice)}</span>
                  <DiscountBadge base={item.basePrice} effective={item.effectivePrice} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

/* ─────────────────────────────────────────────────────────
   Category Pill Tabs
──────────────────────────────────────────────────────── */
const CategoryTabs = ({ cats, activeCategory, onSelect }) => {
  const scrollRef = useRef(null);

  // Auto-scroll active pill into view
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-active="true"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeCategory]);

  const pill = (id, label, icon) => {
    const isActive = activeCategory === id;
    return (
      <button
        key={id}
        data-active={isActive}
        onClick={() => onSelect(id)}
        className={`flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-250 border whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-400 focus-visible:ring-offset-1 ${
          isActive
            ? 'bg-gradient-to-r from-maroon-700 to-maroon-600 text-white border-transparent shadow-[0_4px_14px_rgba(123,28,28,0.28)]'
            : 'bg-white text-[#5A3A3A] border-[rgba(123,28,28,0.12)] hover:bg-maroon-50 hover:border-[rgba(123,28,28,0.22)] hover:shadow-sm'
        }`}
      >
        <span className={isActive ? 'text-white' : 'text-maroon-400'}>{icon}</span>
        {label}
      </button>
    );
  };

  return (
    <div
      ref={scrollRef}
      className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x -mx-4 px-4 sm:mx-0 sm:px-0"
    >
      {pill('all', 'All Items', <Utensils className="w-3.5 h-3.5" />)}
      {cats.map((cat) => pill(cat._id, cat.name, getCategoryIcon(cat.name, 'w-3.5 h-3.5')))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Filter/search bar
──────────────────────────────────────────────────────── */
const FilterBar = ({ search, onSearch, filter, onFilter, totalShown, totalAll }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {/* Search row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7A7A] pointer-events-none" />
          <input
            id="menu-search"
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search dishes…"
            className="w-full h-11 pl-10 pr-4 bg-white border border-[rgba(123,28,28,0.14)] rounded-xl text-[14px] text-maroon-900 placeholder:text-[#C0A080] focus:outline-none focus:ring-2 focus:ring-maroon-300/40 focus:border-maroon-400 transition-all shadow-sm hover:border-[rgba(123,28,28,0.24)]"
          />
          {search && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A7A7A] hover:text-maroon-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`h-11 flex items-center gap-1.5 px-3.5 rounded-xl border text-[13px] font-semibold transition-all duration-200 flex-shrink-0 ${
            filter !== 'all'
              ? 'bg-maroon-700 text-white border-transparent shadow-[0_4px_12px_rgba(123,28,28,0.25)]'
              : 'bg-white text-[#5A3A3A] border-[rgba(123,28,28,0.14)] hover:bg-maroon-50 shadow-sm'
          }`}
          aria-expanded={expanded}
          aria-label="Filter options"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expandable filter chips */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pt-1">
              {['all', 'veg', 'nonveg', 'available', 'special'].map((f) => {
                const labels = { all: 'All', veg: 'Veg Only', nonveg: 'Non-Veg', available: 'Available', special: '⭐ Specials' };
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => { onFilter(f); setExpanded(false); }}
                    className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      active
                        ? 'bg-maroon-700 text-white border-transparent shadow-sm'
                        : 'bg-white text-[#5A3A3A] border-[rgba(123,28,28,0.14)] hover:bg-maroon-50'
                    }`}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result count */}
      {(search || filter !== 'all') && (
        <p className="text-[12px] text-[#9A7A7A]">
          Showing <span className="font-semibold text-maroon-700">{totalShown}</span> of {totalAll} items
        </p>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Special Items Popup / Bottom-Sheet
──────────────────────────────────────────────────────── */
const SpecialPopup = ({ items, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
  >
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-[#1A0505]/80 backdrop-blur-sm"
      onClick={onClose}
    />

    {/* Sheet */}
    <motion.div
      initial={{ scale: 0.96, y: 40, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.96, y: 40, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="relative z-10 w-full sm:max-w-md mx-0 sm:mx-4 bg-[#FDFAF5] rounded-t-[28px] sm:rounded-2xl
        shadow-[0_0_80px_rgba(212,160,23,0.3)] border border-gold-400/20 flex flex-col overflow-hidden"
      style={{ maxHeight: 'min(90dvh, 640px)' }}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-br from-maroon-950 via-maroon-900 to-maroon-800 px-5 pt-4 pb-5 text-center flex-shrink-0 overflow-hidden">
        {/* Drag pill */}
        <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />

        {/* Decorative orbs */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-gold-400/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-maroon-800/50 rounded-full pointer-events-none" />

        <button
          onClick={onClose}
          aria-label="Close popup"
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>

        <motion.div
          initial={{ rotate: -25, scale: 0.3, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 10 }}
          className="relative z-10"
        >
          <PartyPopper className="w-10 h-10 text-gold-400 mx-auto mb-2" />
        </motion.div>
        <h2 className="relative z-10 font-display text-[22px] sm:text-2xl font-bold text-white tracking-wide leading-tight">
          Today's Special
        </h2>
        <p className="relative z-10 text-gold-300 text-[12px] sm:text-[13px] mt-1 leading-relaxed">
          Handpicked combo offers · Available today only
        </p>
      </div>

      {/* Items */}
      <div className="overflow-y-auto overscroll-contain flex-1 px-4 py-4 space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={item._id}
            initial={{ x: -14, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.12 + i * 0.07 }}
            className="flex gap-3 p-3 rounded-xl border border-[rgba(212,160,23,0.28)]
              bg-gradient-to-r from-[rgba(253,250,240,0.9)] to-white
              shadow-sm hover:shadow-[0_4px_16px_rgba(212,160,23,0.18)] transition-all"
          >
            <div className="w-[66px] h-[66px] sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden bg-maroon-50 flex-shrink-0 border border-[rgba(123,28,28,0.07)]">
              {item.image?.url ? (
                <img src={item.image.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-maroon-300 font-display font-bold text-xl">B</div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <VegDot isVeg={item.isVeg} />
                <span className="text-[9px] font-bold tracking-widest uppercase text-gold-600 bg-gold-50 border border-gold-200/60 px-1.5 py-0.5 rounded-full truncate">
                  {item.specialPrice?.label || 'Special Offer'}
                </span>
              </div>
              <h3 className="font-semibold text-[#1A0505] text-[14px] sm:text-[15px] leading-snug mb-1.5 truncate">
                {item.name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] sm:text-[16px] font-bold text-maroon-700">{formatINR(item.effectivePrice)}</span>
                <span className="text-[11px] text-[#9A7A7A] line-through">{formatINR(item.basePrice)}</span>
                <DiscountBadge base={item.basePrice} effective={item.effectivePrice} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="px-4 pt-3 pb-3 border-t border-[rgba(123,28,28,0.07)] bg-white/60 backdrop-blur-sm flex-shrink-0"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-maroon-800 to-maroon-600 text-white rounded-xl font-semibold text-[15px] shadow-[0_4px_16px_rgba(123,28,28,0.28)] hover:shadow-[0_6px_20px_rgba(123,28,28,0.35)] active:scale-[0.98] transition-all touch-manipulation"
        >
          Explore Full Menu
        </button>
      </div>
    </motion.div>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────
   Empty State
──────────────────────────────────────────────────────── */
const EmptyState = ({ query, onClear }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="col-span-full flex flex-col items-center justify-center py-20 px-6 bg-white rounded-2xl border border-[rgba(123,28,28,0.07)] shadow-sm"
  >
    <div className="w-16 h-16 rounded-full bg-maroon-50 flex items-center justify-center mb-4">
      <Search className="w-7 h-7 text-maroon-200" />
    </div>
    <p className="font-display text-[18px] font-semibold text-maroon-900 mb-1">Nothing found</p>
    <p className="text-[13px] text-[#9A7A7A] text-center leading-relaxed max-w-xs">
      {query
        ? `No dishes match "${query}". Try a different keyword or clear the search.`
        : 'No items match your current filters.'}
    </p>
    {(query) && (
      <button
        onClick={onClear}
        className="mt-4 text-[13px] font-semibold text-maroon-600 hover:text-maroon-800 underline underline-offset-2 transition-colors"
      >
        Clear search
      </button>
    )}
  </motion.div>
);

/* ─────────────────────────────────────────────────────────
   Hero Banner (top of page, subtle)
──────────────────────────────────────────────────────── */
const HeroBanner = () => (
  <div className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-800 px-6 py-8 sm:py-10">
    {/* Decorative circles */}
    <div className="absolute -top-10 -right-10 w-44 h-44 bg-gold-400/10 rounded-full pointer-events-none" />
    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-maroon-800/60 rounded-full pointer-events-none" />
    <div className="absolute top-4 right-24 w-20 h-20 bg-gold-300/5 rounded-full pointer-events-none" />

    <div className="relative z-10 max-w-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold-400 bg-gold-400/10 border border-gold-400/20 px-2.5 py-1 rounded-full">
          Fresh Today
        </span>
      </div>
      <h2 className="font-display text-[26px] sm:text-[32px] font-bold text-white leading-tight tracking-tight mb-2">
        Crafted with love,<br />
        <span className="text-gold-400">served with pride.</span>
      </h2>
      <p className="text-[13px] sm:text-[14px] text-maroon-200 leading-relaxed max-w-sm">
        Explore our freshly curated menu — from hearty meals to light bites, made with authentic flavours every day.
      </p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   Main MenuPage
──────────────────────────────────────────────────────── */
const MenuPage = () => {
  const { data, isLoading } = usePublicMenu();
  const { data: categories } = useCategories();

  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showSpecialPopup, setShowSpecialPopup] = useState(false);

  const items = data?.items || [];
  const cats = categories || data?.categories || [];

  const specialItems = useMemo(() => items.filter((i) => i.hasSpecialPrice), [items]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = items;
    if (activeCategory !== 'all') list = list.filter((i) => i.category?._id === activeCategory);
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'veg') list = list.filter((i) => i.isVeg);
    if (filter === 'nonveg') list = list.filter((i) => !i.isVeg);
    if (filter === 'available') list = list.filter((i) => i.isAvailable);
    if (filter === 'special') list = list.filter((i) => i.hasSpecialPrice);
    return list;
  }, [items, activeCategory, search, filter]);

  // Show popup on every page load/refresh
  useEffect(() => {
    if (specialItems.length > 0) {
      const timer = setTimeout(() => setShowSpecialPopup(true), 800);
      return () => clearTimeout(timer);
    }
  }, [specialItems]);

  const clearSearch = useCallback(() => setSearch(''), []);

  if (isLoading) return <LoadingSpinner fullScreen text="Loading menu…" />;

  return (
    <>
      {/* ── Special Popup ─────────────────────────────── */}
      <AnimatePresence>
        {showSpecialPopup && (
          <SpecialPopup items={specialItems} onClose={() => setShowSpecialPopup(false)} />
        )}
      </AnimatePresence>

      {/* ── Page Content ──────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">

        {/* Hero */}
        <HeroBanner />

        {/* Special Items Strip */}
        <SpecialStrip items={specialItems} />

        {/* ── Controls ────────────────────────────────── */}
        <div className="mb-6 space-y-4">
          {/* Category tabs */}
          <CategoryTabs cats={cats} activeCategory={activeCategory} onSelect={setActiveCategory} />

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[rgba(123,28,28,0.10)] to-transparent" />

          {/* Filter bar */}
          <FilterBar
            search={search}
            onSearch={setSearch}
            filter={filter}
            onFilter={setFilter}
            totalShown={filtered.length}
            totalAll={items.length}
          />
        </div>

        {/* ── Menu Grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.length > 0
            ? filtered.map((item, i) => <MenuCard key={item._id} item={item} index={i} />)
            : <EmptyState query={search} onClear={clearSearch} />
          }
        </div>
      </div>
    </>
  );
};

export default MenuPage;
