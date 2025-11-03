import React from 'react';
import { PageData } from '../pages/SplitPdfPage';
import { XIcon, ArrowRightIcon, RefreshCwIcon, Layers2Icon, XSquareIcon } from './Icons';

interface PdfPagePreviewGridProps {
  pages: PageData[];
  onTogglePageSelect: (pageNum: number) => void;
  isProcessing: boolean;
  onProcess: () => void;
  onReset: () => void;
  onInvertSelection: () => void;
  onClearSelection: () => void;
}

const PreviewCard: React.FC<{
    page: PageData;
    onToggleSelect: (pageNum: number) => void;
}> = ({ page, onToggleSelect }) => {
    
    return (
        <div
            onClick={() => onToggleSelect(page.pageNum)}
            className={`relative group bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 transition-all duration-300 cursor-pointer ${page.selected ? 'border-red-500' : 'border-transparent hover:border-brand-primary'}`}
        >
            <img src={page.dataUrl} alt={`Page ${page.pageNum}`} className="w-full h-auto object-contain" />
            
            {page.selected && (
                 <div className="absolute inset-0 bg-red-900 bg-opacity-70 flex items-center justify-center">
                    <XIcon className="w-16 h-16 text-white" />
                </div>
            )}

            <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded">
                {page.pageNum}
            </div>
             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center" />
        </div>
    );
};

export const PdfPagePreviewGrid: React.FC<PdfPagePreviewGridProps> = ({
  pages,
  onTogglePageSelect,
  isProcessing,
  onProcess,
  onReset,
  onInvertSelection,
  onClearSelection,
}) => {
  const selectedCount = pages.filter(p => p.selected).length;
  
  return (
    <div className="w-full max-w-6xl">
       <p className="text-center text-gray-400 mb-6">Click on the pages you want to remove.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
        {pages.map((page) => (
          <PreviewCard
            key={page.pageNum}
            page={page}
            onToggleSelect={onTogglePageSelect}
          />
        ))}
      </div>
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-4">
        <div className="flex flex-wrap items-center gap-2">
            <button onClick={onInvertSelection} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors" title="Invert Selection">
                <Layers2Icon className="w-5 h-5"/> <span>Invert</span>
            </button>
            <button onClick={onClearSelection} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors" title="Clear Selection">
                <XSquareIcon className="w-5 h-5"/> <span>Clear</span>
            </button>
            <button onClick={onReset} className="flex items-center gap-2 px-3 py-2 text-sm bg-red-800 text-white font-semibold rounded-md hover:bg-red-700 transition-colors" title="Start Over">
                <RefreshCwIcon className="w-5 h-5"/> <span>Reset</span>
            </button>
        </div>
        <button
          onClick={onProcess}
          disabled={isProcessing || selectedCount === 0}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isProcessing ? 'Creating PDF...' : `Remove ${selectedCount} Page(s)`}
          {!isProcessing && selectedCount > 0 && <ArrowRightIcon className="w-5 h-5"/>}
        </button>
      </div>
    </div>
  );
};
