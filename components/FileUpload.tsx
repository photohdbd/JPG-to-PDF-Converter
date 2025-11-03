import React, { useState, useCallback, useRef } from 'react';
import { UploadCloudIcon } from './Icons';

interface FileUploadProps {
  onFilesSelect: (files: FileList) => void;
  title?: string;
  accept?: string;
  description?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesSelect, 
  title = "Drag & Drop Your Files Here",
  accept = "image/*,.txt,.md,.csv,.json,.xml,.html,.css,.js,.log,.rtf,.c,.cpp,.java,.py,.php,.rb,.sh,.tex",
  description = "Supports Images, Text Documents (TXT, MD...), and more" 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect(e.dataTransfer.files);
    }
  }, [onFilesSelect]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(e.target.files);
    }
  };

  const dragDropClasses = isDragging 
    ? 'border-brand-primary bg-gray-200 dark:bg-gray-800 scale-105' 
    : 'border-gray-400 dark:border-gray-600 bg-gray-200/50 dark:bg-gray-800/50';

  return (
    <div className="w-full max-w-2xl text-center">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleFileClick}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${dragDropClasses} hover:border-brand-secondary`}
      >
        <UploadCloudIcon className="w-16 h-16 mb-4 text-gray-500 dark:text-gray-500" />
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">or</p>
        <button
          type="button"
          className="mt-4 px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-brand-primary transition-colors"
        >
          Select Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">{description}</p>
      </div>
    </div>
  );
};