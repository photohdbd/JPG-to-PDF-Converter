import React from 'react';
import { Page } from '../App';

interface HeaderProps {
    onNavigate: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-20 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <img src="/favicon.svg" alt="AI PDF Toolkit Logo" className="w-8 h-8"/>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
            AI PDF Toolkit
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">Home</button>
            <button onClick={() => onNavigate('all-tools')} className="hover:text-white transition-colors">All Tools</button>
            <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Contact</button>
        </nav>
        <div className="hidden md:flex items-center gap-2">
            <button onClick={() => onNavigate('login')} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors">Login</button>
            <button onClick={() => onNavigate('signup')} className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-secondary transition-colors">Sign Up</button>
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