import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from './lib/firebase';
import Home from './pages/Home';
import PropertyDetails from './pages/PropertyDetails';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import Favorites from './pages/Favorites';
import MyListings from './pages/MyListings';
import Profile from './pages/Profile';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import ErrorBoundary from './components/ErrorBoundary';
import AIAssistant from './components/AIAssistant';
import { 
  Home as HomeIcon, 
  Search, 
  PlusSquare, 
  User as UserIcon, 
  LogOut,
  MessageSquare,
  LogIn,
  Heart,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setTotalUnread(0);
      return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      let unread = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        unread += data.unreadCount?.[user.uid] || 0;
      });
      setTotalUnread(unread);
    });

    return () => unsubscribeChats();
  }, [user]);

  // Hide nav on Chat pages to prevent overlap and maximize space
  const isChatPage = location.pathname.startsWith('/chat/');

  return (
    <>
      {/* Top Navbar */}
      {!location.pathname.startsWith('/property/') && !isChatPage && (
        <header className="bg-white border-b border-gray-100 fixed top-0 w-full z-40 px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-100">
              <HomeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter text-gray-900">Bari<span className="text-indigo-600">Vara</span></span>
          </Link>
          
          <div className="relative">
            {user ? (
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full border-2 border-indigo-100 p-0.5 overflow-hidden"
              >
                <img src={user.photoURL || "https://ui-avatars.com/api/?name=" + user.displayName} alt="Profile" className="w-full h-full rounded-full" />
              </button>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full font-bold text-sm"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50"
                >
                  <div className="px-3 py-2 mb-2 border-b border-gray-50">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">My Account</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{user?.displayName}</p>
                  </div>
                  <Link 
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-sm font-bold"
                  >
                    <UserIcon className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link 
                    to="/inbox"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-sm font-bold"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4" />
                      Messages
                    </div>
                    {totalUnread > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {totalUnread}
                      </span>
                    )}
                  </Link>
                  <Link 
                    to="/my-listings"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-sm font-bold"
                  >
                    <List className="w-4 h-4" />
                    My Listings
                  </Link>
                  <button 
                    onClick={() => { logout(); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>
      )}

      {/* Bottom Mobile Nav */}
      {!isChatPage && (
        <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 h-16 flex justify-around items-center px-6 z-40 pb-safe">
          <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-bold">Search</span>
          </Link>
          <Link to="/favorites" className={`flex flex-col items-center gap-1 ${location.pathname === '/favorites' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <Heart className="w-6 h-6" />
            <span className="text-[10px] font-bold">Saved</span>
          </Link>
          <Link to="/add" className={`flex flex-col items-center gap-1 ${location.pathname === '/add' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <PlusSquare className="w-6 h-6" />
            <span className="text-[10px] font-bold">Post</span>
          </Link>
          
          {user ? (
            <>
              <Link to="/inbox" className={`flex flex-col items-center gap-1 ${location.pathname === '/inbox' ? 'text-indigo-600' : 'text-gray-400'} relative`}>
                <MessageSquare className="w-6 h-6" />
                <span className="text-[10px] font-bold">Messages</span>
                {totalUnread > 0 && (
                  <span className="absolute -top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </Link>
              <Link to="/my-listings" className={`flex flex-col items-center gap-1 ${location.pathname === '/my-listings' ? 'text-indigo-600' : 'text-gray-400'}`}>
                <List className="w-6 h-6" />
                <span className="text-[10px] font-bold">My List</span>
              </Link>
            </>
          ) : (
            <>
              <button 
                onClick={signInWithGoogle}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <LogIn className="w-6 h-6" />
                <span className="text-[10px] font-bold">Login</span>
              </button>
              <button 
                onClick={signInWithGoogle}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <Heart className="w-6 h-6" />
                <span className="text-[10px] font-bold">Favorites</span>
              </button>
            </>
          )}
        </nav>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="font-sans antialiased text-gray-900">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<div className="pt-16"><Home /></div>} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/add" element={<div className="pt-16"><AddProperty /></div>} />
              <Route path="/edit/:id" element={<div className="pt-16"><EditProperty /></div>} />
              <Route path="/favorites" element={<div className="pt-16"><Favorites /></div>} />
              <Route path="/my-listings" element={<div className="pt-16"><MyListings /></div>} />
              <Route path="/profile" element={<div className="pt-16"><Profile /></div>} />
              <Route path="/inbox" element={<div className="pt-16"><Inbox /></div>} />
              <Route path="/chat/:chatId" element={<Chat />} />
            </Routes>
          </main>
          <AIAssistant />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
