import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { ImagePreviewGrid } from '../components/ImagePreviewGrid';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { callStirlingApi } from '../utils';

export type AppFile = {
  id: string;
  file: File;
  type: 'image' | 'text' | 'unsupported';
  previewUrl?: string;
  textContent?: string;
};

interface JpgToPdfPageProps {
  onNavigate: (page: Page) => void;
}

const getFileType = (file: File): 'image' | 'unsupported' => {
    const fileName = file.name.toLowerCase();
    if (file.type === 'image/jpeg' || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        return 'image';
    }
    return 'unsupported';
};

export const JpgToPdfPage: React.FC<JpgToPdfPageProps> = ({ onNavigate }) => {
  const [appFiles, setAppFiles] = useState<AppFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      appFiles.forEach(appFile => {
        if (appFile.previewUrl) {
          URL.revokeObjectURL(appFile.previewUrl);
        }
      });
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [appFiles, pdfUrl]);

  const handleFilesChange = async (files: FileList | null) => {
    if (!files) return;

    setError(null);
    const newFilesPromises = Array.from(files).map(file => {
      return new Promise<AppFile>((resolve) => {
        const fileType = getFileType(file);
        const baseFile = {
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
          type: fileType,
        };

        if (fileType === 'image') {
          resolve({ ...baseFile, previewUrl: URL.createObjectURL(file) });
        } else {
          resolve({ ...baseFile, type: 'unsupported' });
        }
      });
    });

    const newAppFiles = await Promise.all(newFilesPromises);
    const unsupportedCount = newAppFiles.filter(f => f.type === 'unsupported').length;

    if (unsupportedCount > 0) {
      setError(`${unsupportedCount} file(s) were not JPGs and have been ignored.`);
    }
    
    const supportedFiles = newAppFiles.filter(f => f.type === 'image');
    if (supportedFiles.length > 0) {
      setAppFiles(prev => [...prev, ...supportedFiles]);
    }
  };

  const handleConvertToPdf = useCallback(async () => {
    const filesToConvert = appFiles.filter(f => f.type === 'image');
    if (filesToConvert.length === 0) {
      setError("Please select at least one JPG file to convert.");
      return;
    }

    setIsConverting(true);
    setError(null);
    setProgressMessage('Initializing...');

    try {
      const formData = new FormData();
      filesToConvert.forEach(appFile => {
        formData.append('file', appFile.file);
      });

      const { blob, filename } = await callStirlingApi('/convert-to-pdf', formData, setProgressMessage);

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setDownloadName(filename);
      setAppFiles([]);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during PDF conversion.");
    } finally {
      setIsConverting(false);
      setProgressMessage('');
    }
  }, [appFiles]);

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setAppFiles([]);
    if(pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setDownloadName('');
    setError(null);
    setIsConverting(false);
  };

  const renderContent = () => {
    if (pdfUrl) {
      return <DownloadScreen files={[{url: pdfUrl, name: downloadName}]} onStartOver={reset} autoDownload={true} />;
    }

    if (appFiles.length > 0) {
      return (
        <ImagePreviewGrid
          appFiles={appFiles}
          setAppFiles={setAppFiles}
          isConverting={isConverting}
          onConvertToPdf={handleConvertToPdf}
          onAddMore={handleAddMoreFiles}
          onClearAll={reset}
        />
      );
    }

    return (
      <FileUpload 
        onFilesSelect={handleFilesChange}
        title="Drag & Drop Your JPG Files Here"
        accept="image/jpeg"
        description="Supports .jpg and .jpeg files"
      />
    );
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">JPG to PDF Converter</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">
                Easily convert one or multiple JPG images into a single, high-quality PDF document.
            </p>
            {error && (
            <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-2xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error message">
                <span className="text-xl" aria-hidden="true">&times;</span>
                </button>
            </div>
            )}
            {isConverting && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Converting JPGs to PDF...</p>
                <p className="text-md text-gray-300 mt-2">{progressMessage}</p>
            </div>
            )}
            {renderContent()}
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFilesChange(e.target.files)}
                accept="image/jpeg"
                multiple
                className="hidden"
            />
        </div>
    </div>
  );
};