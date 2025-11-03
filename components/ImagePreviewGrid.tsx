
import React, { useRef, useState } from 'react';
import { ImageFile } from '../App';
import { TrashIcon, PlusIcon, XIcon, ArrowRightIcon } from './Icons';

interface ImagePreviewGridProps {
  imageFiles: ImageFile[];
  setImageFiles: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  isConverting: boolean;
  onConvertToPdf: () => void;
  onAddMore: () => void;
  onClearAll: () => void;
}

const PreviewCard: React.FC<{
    imageFile: ImageFile;
    onRemove: (id: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    onDragEnter: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    index: number;
    isDraggedOver: boolean;
}> = ({ imageFile, onRemove, onDragStart, onDragEnter, onDragEnd, index, isDraggedOver }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnter={(e) => onDragEnter(e, index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`relative group bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 transition-all duration-300 ${isDraggedOver ? 'border-brand-primary scale-105' : 'border-transparent'}`}
        >
            <img src={imageFile.previewUrl} alt={imageFile.file.name} className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                    onClick={() => onRemove(imageFile.id)}
                    className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
                    aria-label="Remove image"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-2 text-xs text-gray-300 truncate" title={imageFile.file.name}>
                {imageFile.file.name}
            </div>
        </div>
    );
};

export const ImagePreviewGrid: React.FC<ImagePreviewGridProps> = ({
  imageFiles,
  setImageFiles,
  isConverting,
  onConvertToPdf,
  onAddMore,
  onClearAll,
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
      const newImageFiles = [...imageFiles];
      const draggedItemContent = newImageFiles.splice(dragItem.current, 1)[0];
      newImageFiles.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setImageFiles(newImageFiles);
    }
    setDraggedOverIndex(null);
  };

  const removeImage = (id: string) => {
    setImageFiles(files => files.filter(file => file.id !== id));
  };
  
  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {imageFiles.map((imageFile, index) => (
          <PreviewCard
            key={imageFile.id}
            imageFile={imageFile}
            onRemove={removeImage}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragEnd={handleDragEnd}
            index={index}
            isDraggedOver={draggedOverIndex === index}
          />
        ))}
      </div>
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4">
        <div className="flex items-center gap-4">
            <button onClick={onAddMore} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors">
                <PlusIcon className="w-5 h-5"/> Add More
            </button>
            <button onClick={onClearAll} className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white font-semibold rounded-md hover:bg-red-700 transition-colors">
                <XIcon className="w-5 h-5"/> Clear All
            </button>
        </div>
        <button
          onClick={onConvertToPdf}
          disabled={isConverting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isConverting ? 'Converting...' : `Convert ${imageFiles.length} Image(s)`}
          {!isConverting && <ArrowRightIcon className="w-5 h-5"/>}
        </button>
      </div>
    </div>
  );
};
