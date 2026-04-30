import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { 
  ChevronLeft, 
  Upload, 
  MapPin, 
  Tag, 
  Layout, 
  CheckCircle,
  X,
  Phone,
  DollarSign,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ['Bachelor', 'Family', 'Office'] as const;
const AMENITIES = [
  'Lift', 'Generator', 'Gas (Cylinder)', 'Gas (Line)', 
  'Parking', 'Security', 'Internet', 'Balcony', 'AC', 'CCTV'
];

export default function AddProperty() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Family' as typeof CATEGORIES[number],
    description: '',
    rent: '',
    deposit: '',
    utilityDetails: '',
    city: '',
    area: '',
    address: '',
    ownerName: '',
    ownerPhone: '',
    ownerWhatsapp: '',
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddImage = () => {
    if (imageUrlInput && !images.includes(imageUrlInput)) {
      setImages(prev => [...prev, imageUrlInput]);
      setImageUrlInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Please login to list your property");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'properties'), {
        ...formData,
        rent: Number(formData.rent),
        deposit: Number(formData.deposit),
        amenities: selectedAmenities,
        images,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate('/');
    } catch (error) {
      console.error("Error adding property:", error);
      alert("Failed to add property. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-50 border-b border-gray-100 px-4 py-4 flex items-center">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-bold text-gray-900 mr-8">Add New Property</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Section: Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Layout className="w-5 h-5 mr-2 text-indigo-500" />
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Property Title</label>
              <input 
                required
                placeholder="e.g. 2BHK Luxury Flat in Dhanmondi"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Category</label>
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, category: cat }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      formData.category === cat 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                        : "bg-gray-50 text-gray-500 border border-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
              <textarea 
                required
                rows={4}
                placeholder="Detailed description about your property, rules, etc."
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm resize-none"
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Section: Pricing */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-indigo-500" />
            Pricing & Utilities
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Monthly Rent</label>
              <input 
                required
                type="number"
                placeholder="e.g. 25000"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
                value={formData.rent}
                onChange={e => setFormData(p => ({ ...p, rent: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Security Deposit</label>
              <input 
                required
                type="number"
                placeholder="e.g. 50000"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
                value={formData.deposit}
                onChange={e => setFormData(p => ({ ...p, deposit: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Utility Details</label>
            <input 
               placeholder="e.g. Electricity prepaid, Gas 1200tk avg"
               className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
               value={formData.utilityDetails}
               onChange={e => setFormData(p => ({ ...p, utilityDetails: e.target.value }))}
            />
          </div>
        </div>

        {/* Section: Location */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-indigo-500" />
            Location
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">City</label>
                <input 
                  required
                  placeholder="e.g. Dhaka"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
                  value={formData.city}
                  onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Area</label>
                <input 
                  required
                  placeholder="e.g. Mirpur"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
                  value={formData.area}
                  onChange={e => setFormData(p => ({ ...p, area: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Address</label>
              <input 
                required
                placeholder="House no, Road no, Sector..."
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
                value={formData.address}
                onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Section: Amenities */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-indigo-500" />
            Amenities
          </h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(amenity => (
              <button
                key={amenity}
                type="button"
                onClick={() => handleToggleAmenity(amenity)}
                className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedAmenities.includes(amenity)
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300"
                }`}
              >
                {selectedAmenities.includes(amenity) && <CheckCircle className="w-3 h-3 mr-1.5" />}
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Section: Media */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-indigo-500" />
            Property Images
          </h2>
          
          <div className="flex gap-2 mb-4">
            <input 
              placeholder="Paste image URL here..."
              className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
              value={imageUrlInput}
              onChange={e => setImageUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
            />
            <button 
              type="button"
              onClick={handleAddImage}
              className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <AnimatePresence>
               {images.map(url => (
                 <motion.div 
                   layout
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   exit={{ scale: 0.8, opacity: 0 }}
                   key={url} 
                   className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 group"
                 >
                   <img src={url} alt="Listing" className="w-full h-full object-cover" />
                   <button 
                     type="button"
                     onClick={() => setImages(prev => prev.filter(i => i !== url))}
                     className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
          {images.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
              No images added. Please provide at least one URL.
            </div>
          )}
        </div>

        {/* Section: Contact */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-indigo-500" />
            Contact Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Owner Name</label>
              <input 
                required
                placeholder="Full Name"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
                value={formData.ownerName}
                onChange={e => setFormData(p => ({ ...p, ownerName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                <input 
                  required
                  placeholder="e.g. 01700000000"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
                  value={formData.ownerPhone}
                  onChange={e => setFormData(p => ({ ...p, ownerPhone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">WhatsApp (Optional)</label>
                <input 
                  placeholder="e.g. 8801700000000"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 text-sm"
                  value={formData.ownerWhatsapp}
                  onChange={e => setFormData(p => ({ ...p, ownerWhatsapp: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || images.length === 0}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? "Posting Listing..." : "Post Property Listing"}
        </button>
      </form>
    </div>
  );
}
