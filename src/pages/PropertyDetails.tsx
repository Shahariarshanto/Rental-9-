import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Property } from '../types';
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Info,
  CheckCircle2,
  Share2,
  Home as HomeIcon,
  User,
  Heart,
  Pencil,
  Settings,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, formatPhoneNumber } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import OptimizedImage from '../components/OptimizedImage';
import { UserProfile } from '../types';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const pData = { id: docSnap.id, ...docSnap.data() } as Property;
          setProperty(pData);

          // Fetch owner profile for privacy setting
          const ownerRef = doc(db, 'users', pData.ownerId);
          const ownerSnap = await getDoc(ownerRef);
          if (ownerSnap.exists()) {
            setOwnerProfile(ownerSnap.data() as UserProfile);
          }
        }

        // Check if favorite
        if (auth.currentUser) {
          const favRef = doc(db, 'favorites', `${auth.currentUser.uid}_${id}`);
          const favSnap = await getDoc(favRef);
          setIsFavorite(favSnap.exists());
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const toggleFavorite = async () => {
    if (!auth.currentUser || !id) {
      alert("Please login to save favorites");
      return;
    }
    setFavLoading(true);
    const favId = `${auth.currentUser.uid}_${id}`;
    const favRef = doc(db, 'favorites', favId);

    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
      } else {
        await setDoc(favRef, {
          userId: auth.currentUser.uid,
          propertyId: id,
          createdAt: serverTimestamp()
        });
        setIsFavorite(true);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `favorites/${favId}`);
    } finally {
      setFavLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && property) {
      navigator.share({
        title: property.title,
        text: `Check out this ${property.category} for rent in ${property.area}, ${property.city}`,
        url: window.location.href,
      });
    }
  };

  const handleAction = (actionType: 'tel' | 'wa' | 'chat') => {
    if (!auth.currentUser) {
      // Redirect to profile/login page
      navigate('/profile');
      return;
    }

    if (actionType === 'chat') {
      if (!property?.ownerId) {
        alert("Listing owner information is missing.");
        return;
      }
      if (isOwner) {
        alert("This is your own listing");
        return;
      }
      const chatRoomId = [auth.currentUser.uid, property.ownerId].sort().join('_');
      navigate(`/chat/${chatRoomId}?ownerId=${property.ownerId}`);
      return;
    }

    const phone = actionType === 'wa' 
      ? (property?.ownerWhatsapp || property?.ownerPhone || '') 
      : (property?.ownerPhone || '');
    
    const link = formatPhoneNumber(phone, actionType);
    
    if (actionType === 'wa') {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = link;
    }
  };

  const isOwner = auth.currentUser?.uid === property?.ownerId;
  const isPrivate = ownerProfile?.contactPrivacy === 'Private';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
        <h2 className="text-xl font-bold text-gray-800">Property not found</h2>
        <p className="text-gray-500 mt-2">The listing might have been removed or is no longer available.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-6 text-indigo-600 font-medium flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header Bar (Transparent overlay on mobile) */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-40" />
      
      <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 pr-4 pl-2 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-xl text-gray-900 font-black text-xs uppercase tracking-widest border border-white/50 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex gap-2">
          {isOwner && (
            <button 
              onClick={() => navigate(`/edit/${id}`)}
              className="p-2 bg-indigo-600 text-white rounded-full shadow-lg active:scale-95 transition-all"
              title="Edit Your Listing"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
          <button 
            disabled={favLoading}
            onClick={toggleFavorite}
            className={`p-2 rounded-full shadow-lg transition-colors ${
              isFavorite ? "bg-red-500 text-white" : "bg-white/80 backdrop-blur-md text-gray-800"
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
          </button>
          <button 
            onClick={handleShare}
            className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-800"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Gallery (Simple Slider/Main Image) */}
      <div className="relative bg-gray-100">
        <div className="h-[40vh] md:h-[60vh] relative overflow-hidden">
          {property.images && property.images.length > 0 ? (
            <OptimizedImage 
              src={property.images[0]} 
              alt={property.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <HomeIcon className="w-20 h-20" />
            </div>
          )}
        </div>

        {/* Thumbnail Gallery (if more than 1 image) */}
        {property.images && property.images.length > 1 && (
          <div className="absolute bottom-12 left-0 right-0 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              {property.images.map((img, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-lg pointer-events-auto"
                >
                  <OptimizedImage 
                    src={img} 
                    alt={`${property.title} - view ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {property.category}
            </span>
            <span className="text-gray-400 text-xs flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {property.createdAt?.toDate().toLocaleDateString() || 'Recently'}
            </span>
          </div>
          
          <h1 className="text-2xl font-black text-gray-900 leading-tight mb-2">
            {property.title}
          </h1>
          
          <div className="flex items-center text-gray-600 mb-6">
            <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
            <span className="text-sm font-medium">{property.address}, {property.area}, {property.city}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-indigo-50 p-4 rounded-2xl text-center">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Monthly Rent</p>
              <p className="text-xl font-black text-indigo-700">{formatCurrency(property.rent)}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl text-center">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Security Deposit</p>
              <p className="text-xl font-black text-emerald-700">{formatCurrency(property.deposit)}</p>
            </div>
          </div>

          <section className="mb-8">
            <h3 className="flex items-center text-lg font-bold text-gray-900 mb-4">
              <Info className="w-5 h-5 mr-2 text-indigo-500" />
              Description
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
              {property.description}
            </p>
            {property.utilityDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 italic text-sm text-gray-600">
                <span className="font-bold text-gray-900 not-italic block mb-1">Utility Notes:</span>
                {property.utilityDetails}
              </div>
            )}
          </section>

          <section className="mb-8">
            <h3 className="flex items-center text-lg font-bold text-gray-900 mb-4">
              <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-500" />
              Amenities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities.map(amenity => (
                <div key={amenity} className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 flex-shrink-0" />
                  <span className="capitalize">{amenity}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="flex items-center text-lg font-bold text-gray-900 mb-4">
              <User className="w-5 h-5 mr-2 text-indigo-500" />
              Owner Information
            </h3>
            <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-4">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{property.ownerName}</p>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Verified Owner</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-8 z-40">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {/* Main Action Group */}
          <div className="flex gap-3">
            {!isPrivate ? (
              <>
                <button 
                  onClick={() => handleAction('tel')}
                  className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-2xl flex items-center justify-center font-bold shadow-lg active:scale-95 transition-transform"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call
                </button>
                <button 
                  onClick={() => handleAction('wa')}
                  className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl flex items-center justify-center font-bold shadow-lg active:scale-95 transition-transform"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp
                </button>
              </>
            ) : (
              <div className="flex-1 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
                 <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                 <p className="text-[10px] font-bold text-amber-800 leading-tight">
                   Contact details are hidden for privacy. Please use the messaging system to connect with the owner safely.
                 </p>
              </div>
            )}
          </div>

          <button 
            onClick={() => handleAction('chat')}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl flex items-center justify-center font-bold shadow-lg active:scale-95 transition-transform"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Message Owner Now
          </button>
        </div>
      </div>
    </div>
  );
}
