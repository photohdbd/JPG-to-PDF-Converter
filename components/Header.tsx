import React from 'react';
import { FileTextIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <FileTextIcon className="w-8 h-8 text-brand-primary" />
          <h1 className="text-xl md:text-2xl font-bold ml-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
            Image to PDF Converter
          </h1>
        </div>
        <p className="hidden md:block text-sm text-gray-400">
          Fast, Free, and Secure
        </p>
      </div>
    </header>
  );
};