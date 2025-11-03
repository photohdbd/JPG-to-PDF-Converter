import React from 'react';

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, color, onClick }) => {
  const isEnabled = !!onClick;

  const content = (
    <>
      <div className={`mb-4 w-20 h-20 rounded-full flex items-center justify-center text-white bg-gradient-to-br ${color}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-base text-gray-500 dark:text-gray-400">{description}</p>
    </>
  );

  if (isEnabled) {
    return (
      <button
        onClick={onClick}
        className="relative text-left w-full h-full p-8 bg-gray-200/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg hover:border-brand-primary hover:scale-105 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="relative text-left w-full h-full p-8 bg-gray-200/80 dark:bg-gray-800/80 border border-gray-300/50 dark:border-gray-700/50 rounded-xl shadow-md cursor-not-allowed opacity-60">
      {content}
    </div>
  );
};