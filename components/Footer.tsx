import React from 'react';
import { GithubIcon } from './Icons';
import { Page } from '../App';

interface FooterProps {
    onNavigate: (page: Page) => void;
}


export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
                <h4 className="font-bold text-white mb-3">Tools</h4>
                <ul className="space-y-2 text-gray-400">
                    <li><button onClick={() => onNavigate('merge')} className="hover:text-white text-left">Merge PDF</button></li>
                    <li><button onClick={() => onNavigate('split')} className="hover:text-white text-left">Split PDF</button></li>
                    <li><button onClick={() => onNavigate('compress')} className="hover:text-white text-left">Compress PDF</button></li>
                    <li><button onClick={() => onNavigate('converter')} className="hover:text-white text-left">Convert to PDF</button></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-white mb-3">Company</h4>
                <ul className="space-y-2 text-gray-400">
                    <li><button onClick={() => onNavigate('about')} className="hover:text-white text-left">About Us</button></li>
                    <li><button onClick={() => onNavigate('pricing')} className="hover:text-white text-left">Pricing</button></li>
                    <li><button onClick={() => onNavigate('contact')} className="hover:text-white text-left">Contact</button></li>
                </ul>
            </div>
             <div>
                <h4 className="font-bold text-white mb-3">Legal</h4>
                <ul className="space-y-2 text-gray-400">
                    <li><button onClick={() => onNavigate('terms')} className="hover:text-white text-left">Terms of Service</button></li>
                    <li><button onClick={() => onNavigate('privacy')} className="hover:text-white text-left">Privacy Policy</button></li>
                    <li><button onClick={() => onNavigate('cookies')} className="hover:text-white text-left">Cookie Policy</button></li>
                </ul>
            </div>
             <div>
                <h4 className="font-bold text-white mb-3">Support</h4>
                <ul className="space-y-2 text-gray-400">
                    <li><button onClick={() => onNavigate('help')} className="hover:text-white text-left">Help Center</button></li>
                    <li><button onClick={() => onNavigate('api_docs')} className="hover:text-white text-left">API Docs</button></li>
                </ul>
            </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
            <p>&copy; {new Date().getFullYear()} AI PDF Toolkit. All rights reserved.</p>
            <button onClick={() => onNavigate('github')} className="flex items-center gap-2 hover:text-gray-300 transition-colors">
                <GithubIcon className="w-4 h-4" />
                <span>View on GitHub</span>
            </button>
        </div>
      </div>
    </footer>
  );
};