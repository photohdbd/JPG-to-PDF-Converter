import React, { useRef, useState } from 'react';
import { PdfFile } from '../pages/MergePdfPage';
import { TrashIcon, PlusIcon, XIcon, ArrowRightIcon, FileTextIcon } from './Icons';

interface PdfPreviewGridProps {
  pdfFiles: PdfFile[];
  setPdfFiles: React.Dispatch<React.SetStateAction<PdfFile[]>>;
  isProcessing: boolean;
  onProcess: () => void;
  onAddMore: () => void;
  onClearAll: () => void;
  processButtonText: string;
}

const PreviewCard: React.FC<{
    pdfFile: PdfFile;
    onRemove: (id: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    index: number;
    isDraggedOver: boolean;
}> = ({ pdfFile, onRemove, onDragStart, onDragEnter, onDragEnd, index, isDraggedOver }) => {
    
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnter={(e) => onDragEnter(e, index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`relative group bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 transition-all duration-300 ${isDraggedOver ? 'border-brand-primary scale-105' : 'border-transparent'}`}
        >
            <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-300 dark:bg-gray-700 p-2">
                <FileTextIcon className="w-12 h-12 text-red-500 dark:text-red-400" />
                <span className="text-xs text-gray-600 dark:text-gray-500 mt-2 uppercase">PDF</span>
            </div>

            <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                    onClick={() => onRemove(pdfFile.id)}
                    className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
                    aria-label="Remove file"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-2 text-xs text-gray-700 dark:text-gray-300 truncate" title={pdfFile.file.name}>
                {pdfFile.file.name}
            </div>
        </div>
    );
};

export const PdfPreviewGrid: React.FC<PdfPreviewGridProps> = ({
  pdfFiles,
  setPdfFiles,
  isProcessing,
  onProcess,
  onAddMore,
  onClearAll,
  processButtonText,
}) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  const handleDragStart = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
    setDraggedOverIndex(position);
  };

  const handleDragEnd = (_e: React.DragEvent<HTMLDivElement>) => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newPdfFiles = [...pdfFiles];
      const draggedItemContent = newPdfFiles.splice(dragItem.current, 1)[0];
      newPdfFiles.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setPdfFiles(newPdfFiles);
    }
    setDraggedOverIndex(null);
  };

  const removeFile = (id: string) => {
    setPdfFiles(files => files.filter(file => file.id !== id));
  };
  
  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {pdfFiles.map((pdfFile, index) => (
          <PreviewCard
            key={pdfFile.id}
            pdfFile={pdfFile}
            onRemove={removeFile}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragEnd={handleDragEnd}
            index={index}
            isDraggedOver={draggedOverIndex === index}
          />
        ))}
      </div>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-2xl">
        <div className="flex items-center gap-4">
            <button onClick={onAddMore} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <PlusIcon className="w-5 h-5"/> Add More
            </button>
            <button onClick={onClearAll} className="flex items-center gap-2 px-4 py-2 bg-red-700 dark:bg-red-800 text-white font-semibold rounded-md hover:bg-red-600 dark:hover:bg-red-700 transition-colors">
                <XIcon className="w-5 h-5"/> Clear All
            </button>
        </div>
        <button
          onClick={onProcess}
          disabled={isProcessing || pdfFiles.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary transition-all duration-300 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isProcessing ? 'Processing...' : `${processButtonText} (${pdfFiles.length})`}
          {!isProcessing && pdfFiles.length > 0 && <ArrowRightIcon className="w-5 h-5"/>}
        </button>
      </div>
    </div>
  );
};