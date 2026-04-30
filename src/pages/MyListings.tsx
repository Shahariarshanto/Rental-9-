import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Property } from '../types';
import { MapPin, Home as HomeIcon, Settings, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';

export default function MyListings() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'properties'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      setProperties(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching my listings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'properties', id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error("Delete error:", e);
      alert("Failed to delete listing.");
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <HomeIcon className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Login to manage listings</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-indigo-600" />
            My Listings
          </h1>
          <Link 
            to="/add" 
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100"
          >
            Add New
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : properties.length > 0 ? (
          <div className="space-y-4">
            {properties.map((p) => (
              <motion.div
                layout
                key={p.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <HomeIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{p.title}</h3>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {p.area}
                  </p>
                  <p className="text-indigo-600 font-bold text-sm mt-1">{formatCurrency(p.rent)}</p>
                </div>

                <div className="flex gap-2">
                  <Link 
                    to={`/property/${p.id}`} 
                    className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:text-indigo-600"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                  <button 
                    onClick={() => setDeleteConfirm(p.id)}
                    className="p-2 bg-red-50 text-red-300 rounded-lg hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">You haven't listed any properties yet</p>
            <Link to="/add" className="text-indigo-600 text-sm font-bold mt-2 inline-block">Post Your First Listing</Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl"
            >
              <h3 className="text-xl font-black text-gray-900 mb-2">Delete Listing?</h3>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone. Are you sure you want to remove this property listing?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-100"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
