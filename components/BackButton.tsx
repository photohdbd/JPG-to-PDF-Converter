import React from 'react';
import { ArrowLeftIcon } from './Icons';

interface BackButtonProps {
  onClick: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-semibold transition-colors mb-6"
    aria-label="Back to Home"
  >
    <ArrowLeftIcon className="w-5 h-5" />
    Back to Home
  </button>
);