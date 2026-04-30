import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  Timestamp,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Property } from '../types';
import { Search, MapPin, Home as HomeIcon, Filter, Plus, Heart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { seedDatabase } from '../lib/seedData';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import OptimizedImage from '../components/OptimizedImage';

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('All Areas');
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [seeding, setSeeding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const TOP_AREAS = ['Dhanmondi', 'Mirpur', 'Uttara', 'Banani', 'Gulshan'];

  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    const areaMatchesSet = new Set<string>();
    const titleMatchesSet = new Set<string>();

    properties.forEach(p => {
      const area = p.area.toLowerCase();
      const title = p.title.toLowerCase();

      if (area.startsWith(query)) {
        areaMatchesSet.add(p.area);
      } else if (area.includes(query)) {
        areaMatchesSet.add(p.area);
      }

      if (title.startsWith(query)) {
        titleMatchesSet.add(p.title);
      } else if (title.includes(query)) {
        titleMatchesSet.add(p.title);
      }
    });

    // Sort: Areas first, then shorter titles (usually more concise)
    const sortedAreas = Array.from(areaMatchesSet).sort((a, b) => a.length - b.length);
    const sortedTitles = Array.from(titleMatchesSet).sort((a, b) => a.length - b.length);

    return [...sortedAreas, ...sortedTitles].slice(0, 6);
  };

  const suggestions = getSuggestions();

  useEffect(() => {
    let unsubFavs: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous subscription if it exists
      if (unsubFavs) {
        unsubFavs();
        unsubFavs = null;
      }

      if (!user) {
        setUserFavorites(new Set());
        return;
      }
      
      const q = query(
        collection(db, 'favorites'), 
        where('userId', '==', user.uid)
      );

      unsubFavs = onSnapshot(q, (snapshot) => {
        const favIds = new Set(snapshot.docs.map(doc => doc.data().propertyId));
        setUserFavorites(favIds);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'favorites');
      });
    });

    return () => {
      unsubAuth();
      if (unsubFavs) unsubFavs();
    };
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!auth.currentUser) {
      alert("Please login to save favorites");
      return;
    }

    const favId = `${auth.currentUser.uid}_${propertyId}`;
    const favRef = doc(db, 'favorites', favId);

    try {
      if (userFavorites.has(propertyId)) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, {
          userId: auth.currentUser.uid,
          propertyId,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `favorites/${favId}`);
    }
  };

  const handleSeed = async () => {
    if (!auth.currentUser) return;
    setSeeding(true);
    try {
      await seedDatabase(auth.currentUser.uid);
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    // Basic query without orderBy on optional fields to prevent filtering
    let q = query(
      collection(db, 'properties'), 
      orderBy('createdAt', 'desc'), 
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      
      // Sort in memory: Featured first, then by date
      const sortedDocs = [...docs].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });

      setProperties(sortedDocs);
      setLoading(false);

      // Auto-seed if database is empty on initial load and user is logged in
      if (snapshot.empty && !seeding && auth.currentUser) {
        handleSeed();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'properties');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [seeding]);

  const filteredProperties = properties.filter(p => {
    const matchesSearch = !searchQuery || 
                         p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesArea = selectedArea === 'All Areas' || p.area.includes(selectedArea);
    
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    const matchesPrice = p.rent >= min && p.rent <= max;

    return matchesSearch && matchesCategory && matchesPrice && matchesArea;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-4">
      {/* Search Header */}
      <div className="px-4 mb-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-10 group-hover:opacity-20 transition-opacity rounded-3xl" />
          <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center px-4 py-1">
            <Search className="text-gray-400 w-5 h-5 mr-3" />
            <input 
              type="text" 
              placeholder="Area, city or property title..." 
              className="w-full py-4 bg-transparent border-none text-gray-900 focus:ring-0 text-sm font-medium"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
              >
                <div className="py-2">
                  <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">Suggestions</p>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
                    >
                      <MapPin className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                      <span className="text-sm font-bold text-gray-700">{suggestion}</span>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-indigo-50/50 transition-colors border-t border-gray-50 group"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-black text-indigo-600">See all results for "{searchQuery}"</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Horizontal Filters Section */}
        <section className="mb-8 overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Categories</h2>
            <button onClick={() => setSelectedCategory('All')} className="text-[10px] font-bold text-indigo-500 uppercase">Reset</button>
          </div>
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide pb-2">
            {['All', 'Bachelor', 'Family', 'Office'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-bold transition-all text-xs border",
                  selectedCategory === cat 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                    : "bg-white text-gray-500 border-gray-100 hover:border-indigo-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 mb-3 px-1">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Popular Areas</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedArea('All Areas')}
              className={cn(
                "px-5 py-2 rounded-xl font-bold text-xs border transition-all",
                selectedArea === 'All Areas' ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white text-gray-400 border-gray-100"
              )}
            >
              All Areas
            </button>
            {TOP_AREAS.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={cn(
                  "px-5 py-2 rounded-xl font-bold text-xs border transition-all",
                  selectedArea === area 
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm" 
                    : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                )}
              >
                {area}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 mb-3 px-1">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Price Range</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide pb-2">
            {[
              { label: 'Budget (<10k)', min: '', max: '10000' },
              { label: 'Standard (10k-25k)', min: '10000', max: '25000' },
              { label: 'Premium (25k+)', min: '25000', max: '' },
            ].map((range) => (
              <button
                key={range.label}
                onClick={() => { setMinPrice(range.min); setMaxPrice(range.max); }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[11px] font-bold transition-all border",
                  minPrice === range.min && maxPrice === range.max
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                    : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </section>

        {/* Listings Section */}
        <div className="mt-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-none">Nearby Rentals</h2>
              <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest">{filteredProperties.length} active listings</p>
            </div>
            {properties.length > 0 && (
              <Filter className="w-5 h-5 text-gray-300" />
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 pb-24">
            {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-gray-400 text-xs font-bold mt-4 tracking-widest">SEARCHING PROPERTIES</p>
              </div>
            ) : filteredProperties.length > 0 ? (
              filteredProperties.map((p, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={p.id}
                >
                  <Link to={`/property/${p.id}`} className="block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-50">
                    <div className="relative h-56 bg-gray-100">
                      <OptimizedImage 
                        src={p.images?.[0] || ""} 
                        alt={p.title} 
                        className="w-full h-full object-cover" 
                        fallbackSrc="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop"
                      />
                      
                      <div className="absolute top-4 right-4 z-20">
                        <button 
                          onClick={(e) => toggleFavorite(e, p.id)}
                          className={cn(
                            "p-2 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-90",
                            userFavorites.has(p.id) ? "bg-red-500 text-white" : "bg-white/80 text-gray-500 hover:text-red-500"
                          )}
                        >
                          <Heart className={cn("w-4 h-4", userFavorites.has(p.id) && "fill-current")} />
                        </button>
                      </div>
                      
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                          {p.category}
                        </span>
                        {p.isFeatured && (
                          <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                            Featured
                          </span>
                        )}
                      </div>
                      
                      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xl">
                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">Monthly Rent</p>
                        <p className="text-lg font-black text-indigo-700 leading-none">{formatCurrency(p.rent)}</p>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-black text-xl text-gray-900 mb-1 truncate">{p.title}</h3>
                      <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-tight">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                        {p.area}, {p.city}
                      </div>

                      <div className="flex gap-2 mt-4">
                        {p.amenities.slice(0, 3).map(a => (
                          <span key={a} className="bg-gray-50 text-gray-500 text-[9px] font-bold px-2 py-1 rounded-lg border border-gray-100 capitalize">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-800">No properties available</h3>
                <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">Try common areas like Dhanmondi or Mirpur, or clear your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Button FAB */}
      <Link 
        to="/add" 
        className="fixed bottom-24 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}

// Helper component for styles
const cn = (...inputs: any) => inputs.filter(Boolean).join(' ');
