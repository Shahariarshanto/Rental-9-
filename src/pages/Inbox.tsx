import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Chat } from '../types';
import { 
  MessageSquare, 
  ChevronLeft, 
  Search, 
  Loader2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Inbox() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/');
      return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      setChats(chatList);
      setLoading(false);
    }, (err) => {
      console.error("Inbox sync error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const filteredChats = chats.filter(chat => {
    const remoteUid = chat.participants.find(p => p !== auth.currentUser?.uid);
    const remoteDetails = chat.participantDetails?.[remoteUid || ''];
    return remoteDetails?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 px-4 h-16 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-gray-900 tracking-tight">Messages</h1>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-white border-2 border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Chat List */}
        <div className="space-y-3">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const remoteUid = chat.participants.find(p => p !== auth.currentUser?.uid);
              const remoteDetails = chat.participantDetails[remoteUid || ''];
              const unreadCount = chat.unreadCount?.[auth.currentUser?.uid || ''] || 0;
              const lastActivity = chat.lastTimestamp?.toDate();

              return (
                <motion.button
                  key={chat.id}
                  layoutId={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="w-full bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all border border-gray-100 group relative"
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-50 shadow-inner">
                      <img 
                        src={remoteDetails?.photoURL || `https://ui-avatars.com/api/?name=${remoteDetails?.displayName}`} 
                        alt="User" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                        {unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-black text-gray-900 truncate pr-4">{remoteDetails?.displayName}</h3>
                      {lastActivity && (
                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                          {lastActivity.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${unreadCount > 0 ? 'font-black text-gray-900' : 'text-gray-500 font-medium'}`}>
                      {chat.lastSenderId === auth.currentUser?.uid ? 'You: ' : ''}
                      {chat.lastMessage || 'Start a conversation'}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </motion.button>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-gray-900">Your Inbox is Empty</h4>
              <p className="text-sm text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                Start a conversation by clicking 'Message Owner' on any property listing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
