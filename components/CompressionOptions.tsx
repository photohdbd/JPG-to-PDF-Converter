import React from 'react';
import { CompressionLevel } from '../pages/CompressPdfPage';
import { CheckCircleIcon, FileTextIcon } from './Icons';

interface CompressionOptionsProps {
  fileName: string;
  fileSize: string;
  level: CompressionLevel;
  setLevel: (level: CompressionLevel) => void;
  customQuality: number;
  setCustomQuality: (quality: number) => void;
}

type OptionCardProps = {
  title: string;
  description: string;
  level: CompressionLevel;
  selectedLevel: CompressionLevel;
  onClick: (level: CompressionLevel) => void;
};

const OptionCard: React.FC<OptionCardProps> = ({ title, description, level, selectedLevel, onClick }) => {
  const isSelected = level === selectedLevel;
  return (
    <div
      onClick={() => onClick(level)}
      className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 relative ${isSelected ? 'bg-brand-primary/20 border-brand-primary' : 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 hover:border-brand-secondary'}`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 text-brand-primary">
          <CheckCircleIcon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
  );
};

export const CompressionOptions: React.FC<CompressionOptionsProps> = ({
  fileName,
  fileSize,
  level,
  setLevel,
  customQuality,
  setCustomQuality,
}) => {
  return (
    <div className="w-full max-w-4xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <FileTextIcon className="w-10 h-10 text-red-500 dark:text-red-400 flex-shrink-0" />
        <div>
          <p className="font-bold text-black dark:text-white truncate" title={fileName}>{fileName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{fileSize}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptionCard
          title="Recommended Compression"
          description="Good compression, high quality."
          level="recommended"
          selectedLevel={level}
          onClick={setLevel}
        />
        <OptionCard
          title="High Compression"
          description="Smaller file size, good quality."
          level="high"
          selectedLevel={level}
          onClick={setLevel}
        />
        <OptionCard
          title="Extreme Compression"
          description="Smallest file size, reduced quality."
          level="extreme"
          selectedLevel={level}
          onClick={setLevel}
        />
        
        <div
          onClick={() => setLevel('custom')}
          className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${level === 'custom' ? 'bg-brand-primary/20 border-brand-primary' : 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 hover:border-brand-secondary'}`}
        >
          {level === 'custom' && (
            <div className="absolute top-3 right-3 text-brand-primary">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
          )}
          <h3 className="text-lg font-bold text-black dark:text-white">Custom Compression</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manually set image quality.</p>
          
          {level === 'custom' && (
            <div className="mt-4">
              <div className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300 mb-2">
                <label htmlFor="quality-slider">Image Quality</label>
                <span className="font-bold bg-brand-primary/30 text-brand-primary-light px-2 py-1 rounded-md">{customQuality}%</span>
              </div>
              <input
                id="quality-slider"
                type="range"
                min="1"
                max="100"
                value={customQuality}
                onChange={(e) => setCustomQuality(Number(e.target.value))}
                className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-secondary"
              />
               <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                <span>Lower</span>
                <span>Higher</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};