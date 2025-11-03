import React from 'react';
import { DocxFile } from '../pages/WordToPdfPage';
import { TrashIcon, PlusIcon, XIcon, ArrowRightIcon, WordIcon, AlertTriangleIcon } from './Icons';

interface DocxPreviewGridProps {
  docxFiles: DocxFile[];
  setDocxFiles: React.Dispatch<React.SetStateAction<DocxFile[]>>;
  isProcessing: boolean;
  onProcess: () => void;
  onAddMore: () => void;
  onClearAll: () => void;
  processButtonText: string;
}

const PreviewCard: React.FC<{
    docxFile: DocxFile;
    onRemove: (id: string) => void;
}> = ({ docxFile, onRemove }) => {
    const isUnsupported = docxFile.status === 'unsupported';
    
    return (
        <div
            draggable={!isUnsupported}
            className={`relative group bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 transition-colors ${isUnsupported ? 'border-yellow-700/80' : 'border-transparent'}`}
            title={isUnsupported ? "Unsupported .doc file. Please re-save as .docx to convert." : docxFile.file.name}
        >
            <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-700 p-2 relative">
                {isUnsupported && (
                    <div className="absolute top-2 right-2 p-1 bg-yellow-500/20 rounded-full">
                        <AlertTriangleIcon className="w-4 h-4 text-yellow-400" />
                    </div>
                )}
                <WordIcon className={`w-12 h-12 ${isUnsupported ? 'text-gray-500' : 'text-blue-400'}`} />
                <span className={`text-xs mt-2 uppercase ${isUnsupported ? 'text-gray-500' : 'text-gray-400'}`}>
                    {docxFile.file.name.split('.').pop()}
                </span>
            </div>

            <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                    onClick={() => onRemove(docxFile.id)}
                    className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
                    aria-label="Remove file"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-2 text-xs text-gray-300 truncate">
                {docxFile.file.name}
            </div>
        </div>
    );
};

export const DocxPreviewGrid: React.FC<DocxPreviewGridProps> = ({
  docxFiles,
  setDocxFiles,
  isProcessing,
  onProcess,
  onAddMore,
  onClearAll,
  processButtonText,
}) => {

  const removeFile = (id: string) => {
    setDocxFiles(files => files.filter(file => file.id !== id));
  };
  
  const supportedFilesCount = docxFiles.filter(f => f.status === 'supported').length;

  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {docxFiles.map((docxFile) => (
          <PreviewCard
            key={docxFile.id}
            docxFile={docxFile}
            onRemove={removeFile}
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
          onClick={onProcess}
          disabled={isProcessing || supportedFilesCount === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isProcessing ? 'Converting...' : `${processButtonText} (${supportedFilesCount})`}
          {!isProcessing && supportedFilesCount > 0 && <ArrowRightIcon className="w-5 h-5"/>}
        </button>
      </div>
    </div>
  );
};
