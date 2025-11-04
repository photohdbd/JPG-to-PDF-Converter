import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { PdfPreviewGrid } from '../components/PdfPreviewGrid';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { callStirlingApi } from '../utils';

export type PdfFile = {
  id: string;
  file: File;
};

interface MergePdfPageProps {
  onNavigate: (page: Page) => void;
}

export const MergePdfPage: React.FC<MergePdfPageProps> = ({ onNavigate }) => {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
      }
    };
  }, [mergedPdfUrl]);

  const handleFilesChange = async (files: FileList | null) => {
    if (!files) return;

    setError(null);
    const newFiles = Array.from(files)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
      }));
    
    const rejectedCount = files.length - newFiles.length;
    if (rejectedCount > 0) {
      setError(`${rejectedCount} file(s) were not valid PDFs and were ignored.`);
    }
    
    if (newFiles.length > 0) {
      setPdfFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleMergePdfs = useCallback(async () => {
    if (pdfFiles.length < 2) {
      setError("Please select at least two PDF files to merge.");
      return;
    }

    setIsMerging(true);
    setError(null);
    setProgressMessage('Initializing...');

    try {
      const formData = new FormData();
      pdfFiles.forEach(pdfFile => {
        formData.append('file', pdfFile.file);
      });

      const { blob, filename } = await callStirlingApi('/api/v1/general/merge', formData, setProgressMessage);
      
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
      setDownloadName(filename);
      setPdfFiles([]);
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during merging.");
    } finally {
      setIsMerging(false);
      setProgressMessage('');
    }
  }, [pdfFiles]);

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setPdfFiles([]);
    if(mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
    setMergedPdfUrl(null);
    setDownloadName('');
    setError(null);
    setIsMerging(false);
  };

  const renderContent = () => {
    if (mergedPdfUrl) {
      return <DownloadScreen files={[{url: mergedPdfUrl, name: downloadName}]} onStartOver={reset} autoDownload={true} />;
    }

    if (pdfFiles.length > 0) {
      return (
        <PdfPreviewGrid
          pdfFiles={pdfFiles}
          setPdfFiles={setPdfFiles}
          isProcessing={isMerging}
          onProcess={handleMergePdfs}
          onAddMore={handleAddMoreFiles}
          onClearAll={reset}
          processButtonText="Merge PDFs"
        />
      );
    }

    return <PdfUpload onFilesSelect={handleFilesChange} />;
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Merge PDF Files</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">
                Combine multiple PDFs into a single document. Drag and drop to reorder files before merging.
            </p>
            {error && (
            <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-4xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <span className="text-xl">×</span>
                </button>
            </div>
            )}
            {isMerging && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Merging PDFs...</p>
                <p className="text-md text-gray-300 mt-2">{progressMessage}</p>
            </div>
            )}
            {renderContent()}
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFilesChange(e.target.files)}
                accept="application/pdf"
                multiple
                className="hidden"
            />
        </div>
    </div>
  );
};