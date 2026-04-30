import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle } from '../lib/firebase';
import { Property } from '../types';
import { MapPin, Home as HomeIcon, Heart, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function Favorites() {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let unsubFavs: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubFavs) {
        unsubFavs();
        unsubFavs = null;
      }

      setUser(u);
      if (!u) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', u.uid)
      );

      unsubFavs = onSnapshot(q, async (snapshot) => {
        try {
          const propertyPromises = snapshot.docs.map(async (favDoc) => {
            const propertyId = favDoc.data().propertyId;
            const propSnap = await getDoc(doc(db, 'properties', propertyId));
            if (propSnap.exists()) {
              return { id: propSnap.id, ...propSnap.data() } as Property;
            }
            return null;
          });

          const results = await Promise.all(propertyPromises);
          setFavorites(results.filter((p): p is Property => p !== null));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'favorites_related_properties');
        } finally {
          setLoading(false);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'favorites');
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubFavs) unsubFavs();
    };
  }, []);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-gray-200" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 leading-tight">Your favorite list is waiting</h2>
        <p className="text-gray-400 text-sm mt-3 max-w-xs mx-auto font-medium">Login to save your favorite properties and find them easily later.</p>
        <button 
          onClick={signInWithGoogle}
          className="mt-8 bg-indigo-600 text-white flex items-center justify-center gap-3 px-8 py-4 rounded-3xl font-black text-sm shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <LogIn className="w-5 h-5" />
          LOGIN WITH GOOGLE
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-none">Saved Properties</h1>
            <p className="text-gray-400 text-[10px] font-black mt-2 uppercase tracking-widest">{favorites.length} properties saved</p>
          </div>
          <Heart className="w-6 h-6 text-red-500 fill-current" />
        </div>

        {loading ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-gray-400 mt-4 tracking-widest uppercase">Fetching listings</p>
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 pb-24">
            <AnimatePresence mode="popLayout">
              {favorites.map((p, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  key={p.id}
                >
                  <Link to={`/property/${p.id}`} className="block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-50">
                    <div className="relative h-44 bg-gray-100">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <HomeIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-2 rounded-2xl text-red-500 shadow-xl border border-white/50">
                        <Heart className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-black text-lg text-gray-900 truncate leading-none mb-2">{p.title}</h3>
                      <div className="flex items-center text-gray-400 text-[11px] font-bold uppercase tracking-tight">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                        {p.area}, {p.city}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-lg font-black text-indigo-600">{formatCurrency(p.rent)}</span>
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">View Details</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-800">Your list is empty</h3>
            <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">Found a property you like? Tap the heart icon to save it here.</p>
            <Link 
              to="/" 
              className="mt-8 bg-gray-900 text-white px-8 py-4 rounded-3xl font-black text-sm shadow-xl active:scale-95 transition-all inline-block"
            >
              BROWSE LISTINGS
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
