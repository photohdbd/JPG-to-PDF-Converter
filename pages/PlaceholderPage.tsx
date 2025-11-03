import React from 'react';

interface PlaceholderPageProps {
  title: string;
  comingSoon?: boolean;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, comingSoon = false }) => {
  return (
    <div className="w-full max-w-4xl text-center flex flex-col items-center justify-center py-16">
      <div className="relative inline-block">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          {title}
        </h1>
        {comingSoon && (
           <span className="absolute -top-2 -right-4 transform translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Coming Soon
          </span>
        )}
      </div>
      <p className="text-lg text-gray-400 mt-6 max-w-lg">
        {comingSoon
          ? "We're working hard to bring this feature to you. Please check back later!"
          : "This page is under construction. Content will be available shortly."}
      </p>
      <div className="mt-12 text-6xl opacity-10">
        📄
      </div>
    </div>
  );
};
