import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Chat, Message, UserProfile } from '../types';
import { 
  Send, 
  ChevronLeft, 
  Loader2, 
  MoreVertical, 
  Phone,
  MessageCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPhoneNumber } from '../lib/utils';
import OptimizedImage from '../components/OptimizedImage';

export default function ChatRoom() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const ownerId = queryParams.get('ownerId');

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [remoteUser, setRemoteUser] = useState<UserProfile | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!auth.currentUser || !chatId) return;

    // 1. Fetch/Create Chat Metadata
    const fetchChatAndInit = async () => {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        if (!ownerId) {
          navigate('/inbox');
          return;
        }

        // Fetch owner details to initialize chat
        const ownerSnap = await getDoc(doc(db, 'users', ownerId));
        const ownerData = ownerSnap.data() as UserProfile;
        
        const mySnap = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        const myData = mySnap.data() as UserProfile;

        const newChat: Partial<Chat> = {
          participants: [auth.currentUser!.uid, ownerId],
          participantDetails: {
            [auth.currentUser!.uid]: {
              displayName: myData.displayName,
              photoURL: myData.photoURL || `https://ui-avatars.com/api/?name=${myData.displayName}`,
            },
            [ownerId]: {
              displayName: ownerData.displayName,
              photoURL: ownerData.photoURL || `https://ui-avatars.com/api/?name=${ownerData.displayName}`,
            }
          },
          lastTimestamp: serverTimestamp(),
          unreadCount: {
            [ownerId]: 0,
            [auth.currentUser!.uid]: 0,
          }
        };
        await setDoc(chatRef, newChat);
        setChat({ id: chatId, ...newChat } as Chat);
        setRemoteUser(ownerData);
      } else {
        const cData = { id: chatId, ...chatSnap.data() } as Chat;
        setChat(cData);
        
        // Identify remote user
        const remoteUid = cData.participants.find(p => p !== auth.currentUser?.uid);
        if (remoteUid) {
          const rSnap = await getDoc(doc(db, 'users', remoteUid));
          setRemoteUser(rSnap.data() as UserProfile);
        }

        // Reset unread count for me
        await updateDoc(chatRef, {
          [`unreadCount.${auth.currentUser?.uid}`]: 0
        });
      }
    };

    fetchChatAndInit();

    // 2. Subscribe to Messages
    const msgsQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribe();
  }, [chatId, ownerId, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !auth.currentUser || !chatId) return;

    setSending(true);
    const text = inputText;
    setInputText('');

    try {
      const chatRef = doc(db, 'chats', chatId);
      const remoteUid = chat?.participants.find(p => p !== auth.currentUser?.uid);

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: auth.currentUser.uid,
        text,
        createdAt: serverTimestamp(),
        isRead: false,
      });

      await updateDoc(chatRef, {
        lastMessage: text,
        lastSenderId: auth.currentUser.uid,
        lastTimestamp: serverTimestamp(),
        [`unreadCount.${remoteUid}`]: increment(1)
      });

      scrollToBottom();
    } catch (err) {
      console.error("Message send error:", err);
    } finally {
      setSending(false);
    }
  };

  if (loading && !chat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-indigo-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-2xl mx-auto border-x border-gray-100">
      {/* Header */}
      <header className="bg-white px-4 h-16 flex items-center justify-between border-b border-gray-100 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/inbox')} className="p-2 -ml-2 text-gray-500">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-50">
              <img 
                src={remoteUser?.photoURL || "https://ui-avatars.com/api/?name=" + remoteUser?.displayName} 
                alt={remoteUser?.displayName || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 leading-none">{remoteUser?.displayName}</h2>
              <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-tighter flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Online Now
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
           {remoteUser?.contactPrivacy === 'Public' && (
             <>
               <a href={remoteUser.phoneNumber ? formatPhoneNumber(remoteUser.phoneNumber, 'tel') : '#'} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                 <Phone className="w-5 h-5" />
               </a>
               <a href={remoteUser.whatsappNumber || remoteUser.phoneNumber ? formatPhoneNumber(remoteUser.whatsappNumber || remoteUser.phoneNumber || '', 'wa') : '#'} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
                 <MessageCircle className="w-5 h-5" />
               </a>
             </>
           )}
           <button className="p-2 text-gray-400">
             <MoreVertical className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          const showDate = idx === 0 || 
            (messages[idx-1].createdAt?.toDate().toDateString() !== msg.createdAt?.toDate().toDateString());

          return (
            <React.Fragment key={msg.id}>
              {showDate && msg.createdAt && (
                <div className="flex justify-center my-4">
                  <span className="bg-white px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">
                    {msg.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 justify-end opacity-50`}>
                    <Clock className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-medium">
                      {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0 pb-8">
        <form onSubmit={handleSendMessage} className="relative">
          <input 
            type="text"
            placeholder="Type your message..."
            className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-4 pr-14 text-sm font-medium focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || sending}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
