import React from 'react';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

interface HeaderProps {
    onNavigate: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onNavigate('home');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-20 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <img src="/favicon.svg" alt="LOLOPDF Logo" className="w-10 h-10" />
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
            LOLOPDF
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">Home</button>
            <button onClick={() => onNavigate('all-tools')} className="hover:text-white transition-colors">All Tools</button>
            <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">Pricing</button>
            {currentUser && <button onClick={() => onNavigate('dashboard')} className="hover:text-white transition-colors">Dashboard</button>}
            <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Contact</button>
        </nav>
        <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                <span className="text-sm text-gray-400 hidden lg:block" title={currentUser.email || ''}>{currentUser.displayName || currentUser.email}</span>
                {currentUser.photoURL && <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />}
                <button onClick={handleLogout} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors">Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => onNavigate('login')} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors">Login</button>
                <button onClick={() => onNavigate('signup')} className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-secondary transition-colors">Sign Up</button>
              </>
            )}
        </div>
        <div className="md:hidden">
            {/* Mobile menu button can be added here */}
            <button className="p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
        </div>
      </div>
    </header>
  );
};