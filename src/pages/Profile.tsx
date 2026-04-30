import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Info, 
  Camera, 
  Save, 
  X, 
  Loader2,
  ChevronLeft,
  MessageSquare,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import OptimizedImage from '../components/OptimizedImage';
import { formatPhoneNumber } from '../lib/utils';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    whatsappNumber: '',
    bio: '',
    city: '',
    area: '',
    photoURL: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) {
        navigate('/');
        return;
      }

      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setFormData({
            displayName: data.displayName || '',
            phoneNumber: data.phoneNumber || '',
            whatsappNumber: data.whatsappNumber || '',
            bio: data.bio || '',
            city: data.city || '',
            area: data.area || '',
            photoURL: data.photoURL || '',
          });
        } else {
          // Initialize profile from auth if first time
          const newProfile: UserProfile = {
            uid: auth.currentUser.uid,
            displayName: auth.currentUser.displayName || 'Guest User',
            email: auth.currentUser.email || '',
            photoURL: auth.currentUser.photoURL || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
          setFormData({
            displayName: newProfile.displayName,
            phoneNumber: '',
            whatsappNumber: '',
            bio: '',
            city: '',
            area: '',
            photoURL: newProfile.photoURL || '',
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      
      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser?.uid}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 px-4 h-16 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-gray-900 tracking-tight">My Profile</h1>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="max-w-md mx-auto mt-6 px-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-50 shadow-inner mb-4">
              <OptimizedImage 
                src={profile?.photoURL || "https://ui-avatars.com/api/?name=" + profile?.displayName} 
                alt="Profile" 
                className="w-full h-full object-cover"
                fallbackSrc="https://ui-avatars.com/api/?name=User"
              />
            </div>
            <button className="absolute bottom-4 right-0 p-1.5 bg-indigo-600 text-white rounded-full shadow-lg border-2 border-white">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900">{profile?.displayName}</h2>
          <p className="text-sm text-gray-500 font-medium">{profile?.email}</p>
          
          {profile?.bio && !isEditing && (
            <p className="mt-4 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-2xl w-full italic">
              "{profile.bio}"
            </p>
          )}

          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Details List */}
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                <a 
                  href={profile?.phoneNumber ? formatPhoneNumber(profile.phoneNumber, 'tel') : '#'}
                  className={`flex items-center gap-4 group ${!profile?.phoneNumber && 'pointer-events-none'}`}
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-sm font-bold text-gray-900">{profile?.phoneNumber || "Not provided"}</p>
                  </div>
                </a>

                <a 
                  href={profile?.whatsappNumber || profile?.phoneNumber ? formatPhoneNumber(profile?.whatsappNumber || profile?.phoneNumber || '', 'wa') : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-4 group ${(!profile?.whatsappNumber && !profile?.phoneNumber) && 'pointer-events-none'}`}
                >
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp</p>
                    <p className="text-sm font-bold text-gray-900">{profile?.whatsappNumber || profile?.phoneNumber || "Not provided"}</p>
                  </div>
                </a>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-bold text-gray-900">
                      {profile?.city && profile?.area ? `${profile.area}, ${profile.city}` : "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600/5 rounded-2xl p-5 border border-indigo-100 flex items-start gap-4">
                 <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
                 <div>
                    <p className="text-sm font-bold text-indigo-900">Your data is secure</p>
                    <p className="text-xs text-indigo-700/70 mt-1 leading-relaxed">
                       Only your contact details are shown to people when you post property listings. 
                    </p>
                 </div>
              </div>
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleUpdate} 
              className="bg-white rounded-3xl p-6 shadow-xl space-y-5 border border-gray-100"
            >
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Profile Picture URL</label>
                <div className="relative">
                  <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    placeholder="Paste image URL here..."
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                    value={formData.photoURL}
                    onChange={e => setFormData(p => ({ ...p, photoURL: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Display Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                    value={formData.displayName}
                    onChange={e => setFormData(p => ({ ...p, displayName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Bio / About Me</label>
                <div className="relative">
                  <Info className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                  <textarea 
                    rows={3}
                    placeholder="Tell users something about yourself..."
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100 resize-none"
                    value={formData.bio}
                    onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone</label>
                  <input 
                    placeholder="017xxxxxxxx"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                    value={formData.phoneNumber}
                    onChange={e => setFormData(p => ({ ...p, phoneNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">WhatsApp</label>
                  <input 
                    placeholder="88017..."
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                    value={formData.whatsappNumber}
                    onChange={e => setFormData(p => ({ ...p, whatsappNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">City</label>
                  <input 
                    placeholder="e.g. Dhaka"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                    value={formData.city}
                    onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Area</label>
                  <input 
                    placeholder="e.g. Dhanmondi"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100"
                    value={formData.area}
                    onChange={e => setFormData(p => ({ ...p, area: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
