import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Leaf, Flame, Star, Clock } from 'lucide-react';
import { usePublicMenu, useCategories } from '../../hooks/useMenu';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatINR } from '../../utils/currency.utils';

const MenuPage = () => {
  const { data, isLoading } = usePublicMenu();
  const { data: categories } = useCategories();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const items = data?.items || [];
  const cats = categories || data?.categories || [];

  const specialItems = useMemo(() => items.filter((i) => i.hasSpecialPrice), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (activeCategory !== 'all') list = list.filter((i) => i.category?._id === activeCategory);
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [items, activeCategory, search]);

  if (isLoading) return <LoadingSpinner fullScreen text="Loading menu..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-20 font-body">
      {/* Special Today */}
      {specialItems.length > 0 && (
        <motion.section initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-6 h-6 text-gold-400" />
            <h2 className="font-display text-[22px] font-bold text-maroon-800 tracking-tight">Special Today</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {specialItems.map((item) => (
              <div key={item._id} className="flex-shrink-0 w-64 bg-surface-card border border-[rgba(212,160,23,0.3)] rounded-xl p-5 shadow-[0_4px_24px_rgba(212,160,23,0.06)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gold-400/20 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-2 mb-3 relative z-10">
                  {item.isVeg ? <Leaf className="w-4 h-4 text-[#2D7A3A]" /> : <Flame className="w-4 h-4 text-[#E53935]" />}
                  <span className="text-[11px] font-medium tracking-wide uppercase text-gold-500">{item.specialPrice?.label || 'Special'}</span>
                </div>
                <h3 className="font-semibold text-[#1A0505] text-[15px] mb-2 relative z-10 leading-snug">{item.name}</h3>
                <div className="flex items-center gap-2.5 relative z-10 mt-4">
                  <span className="text-xl font-bold text-maroon-700">{formatINR(item.effectivePrice)}</span>
                  <span className="text-[13px] text-[#9A7A7A] line-through">{formatINR(item.basePrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button onClick={() => setActiveCategory('all')} className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 border ${activeCategory === 'all' ? 'bg-maroon-700 text-white border-maroon-700 shadow-bpc' : 'bg-surface-card text-[#5A3A3A] border-[rgba(123,28,28,0.08)] hover:bg-maroon-50'}`}>
            All Items
          </button>
          {cats.map((cat) => (
            <button key={cat._id} onClick={() => setActiveCategory(cat._id)} className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 border whitespace-nowrap ${activeCategory === cat._id ? 'bg-maroon-700 text-white border-maroon-700 shadow-bpc' : 'bg-surface-card text-[#5A3A3A] border-[rgba(123,28,28,0.08)] hover:bg-maroon-50'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 flex-shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9A7A7A]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu..." className="form-input pl-10" id="menu-search" />
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((item, i) => (
          <motion.div key={item._id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.03 }}
            className={`bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-bpc-lg hover:border-[rgba(123,28,28,0.15)] ${!item.isAvailable ? 'opacity-60 grayscale-[0.2]' : ''}`}>
            
            <div className="h-40 bg-maroon-50 relative overflow-hidden group">
              {item.image?.url ? (
                <img src={item.image.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border border-maroon-200 flex items-center justify-center text-maroon-300 font-display font-bold text-xl">B</div>
                </div>
              )}
              {/* Veg/Non-veg indicator overlay */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
                <div className={`w-3.5 h-3.5 rounded-sm border-[1.5px] flex items-center justify-center ${item.isVeg ? 'border-[#2D7A3A]' : 'border-[#E53935]'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-[#2D7A3A]' : 'bg-[#E53935]'}`} />
                </div>
              </div>
              {!item.isAvailable && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-[#1A0505] text-white text-[11px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider shadow-lg">Sold Out</span>
                </div>
              )}
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-semibold text-[#1A0505] text-[15px] leading-tight mb-1.5">{item.name}</h3>
              {item.description && <p className="text-[12px] text-[#9A7A7A] mb-4 line-clamp-2 leading-relaxed flex-1">{item.description}</p>}
              {!item.description && <div className="flex-1" />}
              
              <div className="flex items-end justify-between mt-auto pt-4 border-t border-[rgba(123,28,28,0.05)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-maroon-700">{formatINR(item.effectivePrice)}</span>
                    {item.hasSpecialPrice && <span className="text-[12px] text-[#9A7A7A] line-through">{formatINR(item.basePrice)}</span>}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#9A7A7A] uppercase tracking-wider bg-maroon-50 px-2 py-1 rounded">{item.unit}</span>
              </div>
              {item.hasSpecialPrice && (
                <div className="mt-3 text-[10px] font-medium tracking-wide uppercase text-gold-500 flex items-center gap-1">
                  <Star className="w-3 h-3" /> {item.specialPrice?.label || 'Special Price'}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-surface-card rounded-xl border border-[rgba(123,28,28,0.08)] mt-6">
          <Search className="w-10 h-10 text-maroon-200 mx-auto mb-4" />
          <p className="text-[#5A3A3A] font-medium text-[15px]">No items found</p>
          <p className="text-[#9A7A7A] text-[13px] mt-1">Try adjusting your search or category filters</p>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
