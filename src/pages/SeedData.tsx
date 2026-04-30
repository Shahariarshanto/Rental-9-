import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  limit
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ChevronLeft, Database, User as UserIcon, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

export default function SeedData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [status, setStatus] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    setStatus('Fetching users...');
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(10)));
      const fetchedUsers: UserProfile[] = [];
      usersSnap.forEach(doc => {
        const data = doc.data() as UserProfile;
        if (doc.id !== auth.currentUser?.uid) {
          fetchedUsers.push({ ...data, uid: doc.id });
        }
      });
      setUsers(fetchedUsers);
      setStatus(fetchedUsers.length > 0 ? `Found ${fetchedUsers.length} other users.` : 'No other users found.');
    } catch (error) {
      console.error(error);
      setStatus('Error fetching users.');
    } finally {
      setLoading(false);
    }
  };

  const seedChat = async (targetUser: UserProfile) => {
    if (!auth.currentUser || !targetUser.uid) return;
    
    setLoading(true);
    setStatus(`Seeding chat with ${targetUser.displayName}...`);
    try {
      const myId = auth.currentUser.uid;
      const otherId = targetUser.uid;
      const chatId = [myId, otherId].sort().join('_');
      
      const chatRef = doc(db, 'chats', chatId);
      
      // Initialize Chat
      await setDoc(chatRef, {
        participants: [myId, otherId],
        participantDetails: {
          [myId]: {
            displayName: auth.currentUser.displayName || 'Me',
            photoURL: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=Me`
          },
          [otherId]: {
            displayName: targetUser.displayName || 'User',
            photoURL: targetUser.photoURL || `https://ui-avatars.com/api/?name=${targetUser.displayName}`
          }
        },
        lastMessage: "Hello! This is a dummy message.",
        lastTimestamp: serverTimestamp(),
        unreadCount: {
          [myId]: 0,
          [otherId]: 1
        }
      });

      // Add dummy messages
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      const dummyMessages = [
        { text: "Hi there! Is this property still available?", senderId: myId },
        { text: "Hello! Yes, it's still available. When would you like to visit?", senderId: otherId },
        { text: "Can I come tomorrow afternoon?", senderId: myId },
        { text: "Sure! Tomorrow at 4 PM works for me.", senderId: otherId },
        { text: "Great, see you then!", senderId: myId }
      ];

      for (const msg of dummyMessages) {
        await addDoc(messagesRef, {
          ...msg,
          createdAt: serverTimestamp()
        });
      }

      setStatus(`Successfully seeded chat with ${targetUser.displayName}!`);
    } catch (error) {
      console.error(error);
      setStatus('Error seeding chat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 px-4 h-16 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-gray-900 tracking-tight">Data Seeder</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6 max-w-md mx-auto w-full">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Seed Chat Data</h2>
              <p className="text-xs text-gray-500 font-medium">Add dummy messages between you and others</p>
            </div>
          </div>

          <button 
            onClick={fetchUsers}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserIcon className="w-5 h-5" />}
            Find Potential Chat Partners
          </button>

          {status && (
            <div className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${status.includes('Successfully') ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {status.includes('Successfully') && <CheckCircle2 className="w-4 h-4" />}
              {status}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {users.map(user => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={user.uid} 
              className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-gray-100" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{user.displayName}</h3>
                </div>
              </div>
              <button 
                onClick={() => seedChat(user)}
                disabled={loading}
                className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors"
                title="Seed Chat"
              >
                <Send className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        {users.length > 0 && (
          <button 
            onClick={() => navigate('/inbox')}
            className="w-full mt-6 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-bold text-sm hover:border-indigo-100 hover:text-indigo-600 transition-all"
          >
            Go to Inbox
          </button>
        )}
      </div>
    </div>
  );
}
