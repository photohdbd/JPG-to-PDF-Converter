import React, { useState } from 'react';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { MoonIcon, SunIcon, XIcon } from './Icons';

interface HeaderProps {
    onNavigate: (page: Page) => void;
    theme: string;
    toggleTheme: () => void;
}

const ThemeToggle: React.FC<{ theme: string; toggleTheme: () => void }> = ({ theme, toggleTheme }) => (
    <button
        onClick={toggleTheme}
        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
    >
        {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
);


export const Header: React.FC<HeaderProps> = ({ onNavigate, theme, toggleTheme }) => {
  const { currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onNavigate('home');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleMobileNav = (page: Page) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };
  
  const handleLogoutAndClose = () => {
    handleLogout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <img src="/favicon.svg" alt="LOLOPDF Logo" className="w-10 h-10" />
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
              LOLOPDF
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
              <button onClick={() => onNavigate('home')} className="hover:text-black dark:hover:text-white transition-colors">Home</button>
              <button onClick={() => onNavigate('all-tools')} className="hover:text-black dark:hover:text-white transition-colors">All Tools</button>
              <button onClick={() => onNavigate('pricing')} className="hover:text-black dark:hover:text-white transition-colors">Pricing</button>
              {currentUser && <button onClick={() => onNavigate('dashboard')} className="hover:text-black dark:hover:text-white transition-colors">Dashboard</button>}
              <button onClick={() => onNavigate('contact')} className="hover:text-black dark:hover:text-white transition-colors">Contact</button>
          </nav>
          <div className="flex items-center gap-3">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              <div className='hidden md:flex items-center gap-3'>
                {currentUser ? (
                  <>
                    <span className="text-sm text-gray-500 dark:text-gray-400 hidden lg:block" title={currentUser.email || ''}>{currentUser.displayName || currentUser.email}</span>
                    {currentUser.photoURL && <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />}
                    <button onClick={handleLogout} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">Logout</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => onNavigate('login')} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">Login</button>
                    <button onClick={() => onNavigate('signup')} className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-secondary transition-colors">Sign Up</button>
                  </>
                )}
              </div>
              <div className="md:hidden">
                  <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-700 dark:text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                  </button>
              </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-gray-900/95 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
          <div className="flex flex-col items-center justify-center h-full">
              <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white">
                  <XIcon className="w-8 h-8" />
              </button>
              <nav className="flex flex-col items-center gap-8 text-2xl font-medium text-gray-300">
                  <button onClick={() => handleMobileNav('home')} className="hover:text-white transition-colors">Home</button>
                  <button onClick={() => handleMobileNav('all-tools')} className="hover:text-white transition-colors">All Tools</button>
                  <button onClick={() => handleMobileNav('pricing')} className="hover:text-white transition-colors">Pricing</button>
                  {currentUser && <button onClick={() => handleMobileNav('dashboard')} className="hover:text-white transition-colors">Dashboard</button>}
                  <button onClick={() => handleMobileNav('contact')} className="hover:text-white transition-colors">Contact</button>
                  <div className="mt-8 border-t border-gray-700 w-full flex flex-col items-center pt-8 gap-6">
                    {currentUser ? (
                         <button onClick={handleLogoutAndClose} className="px-6 py-3 text-lg font-semibold rounded-md hover:bg-gray-800 transition-colors w-48 text-center">Logout</button>
                    ) : (
                        <>
                            <button onClick={() => handleMobileNav('login')} className="px-6 py-3 text-lg font-semibold rounded-md hover:bg-gray-800 transition-colors w-48 text-center">Login</button>
                            <button onClick={() => handleMobileNav('signup')} className="px-6 py-3 text-lg font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-secondary transition-colors w-48 text-center">Sign Up</button>
                        </>
                    )}
                  </div>
              </nav>
          </div>
      </div>
    </>
  );
};