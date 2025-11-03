import React from 'react';
import { GithubIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-2">
        <p>&copy; {new Date().getFullYear()} Image to PDF Converter. All rights reserved.</p>
        <a href="https://github.com/example/image-to-pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gray-300 transition-colors">
          <GithubIcon className="w-4 h-4" />
          <span>View on GitHub</span>
        </a>
      </div>
    </footer>
  );
};