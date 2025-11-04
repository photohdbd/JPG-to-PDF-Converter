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

interface GenericToPdfPageProps {
  onNavigate: (page: Page) => void;
  pageTitle: string;
  pageDescription: string;
  fileUploadTitle: string;
  acceptedMimeTypes: string;
  fileTypeDescription: string;
}

export const GenericToPdfPage: React.FC<GenericToPdfPageProps> = ({
  onNavigate,
  pageTitle,
  pageDescription,
  fileUploadTitle,
  acceptedMimeTypes,
  fileTypeDescription,
}) => {
  const [appFiles, setAppFiles] = useState<AppFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypesArray = acceptedMimeTypes.split(',').map(t => t.trim().toLowerCase());

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
      return new Promise<AppFile | null>((resolve) => {
        const fileTypeLower = file.type.toLowerCase();
        const fileNameLower = file.name.toLowerCase();

        const isAccepted = acceptedTypesArray.some(acceptedType => {
          if (acceptedType.startsWith('.')) { // extension check
            return fileNameLower.endsWith(acceptedType);
          }
          if (acceptedType.endsWith('/*')) { // wildcard mime type
            return fileTypeLower.startsWith(acceptedType.slice(0, -1));
          }
          return fileTypeLower === acceptedType;
        });

        if (!isAccepted) {
            resolve(null);
            return;
        }

        const baseFile: AppFile = {
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
          type: 'image', // Assume image for preview purposes, backend handles it
        };

        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
             resolve({ ...baseFile, previewUrl: e.target?.result as string });
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        } else {
          // For non-image files, don't create a preview URL, show generic icon
          resolve({ ...baseFile, type: 'text' });
        }
      });
    });

    const newAppFiles = (await Promise.all(newFilesPromises)).filter(f => f !== null) as AppFile[];
    const rejectedCount = files.length - newAppFiles.length;

    if (rejectedCount > 0) {
      setError(`${rejectedCount} file(s) were of the wrong type and have been ignored.`);
    }
    
    if (newAppFiles.length > 0) {
      setAppFiles(prev => [...prev, ...newAppFiles]);
    }
  };

  const handleConvertToPdf = useCallback(async () => {
    const filesToConvert = appFiles;
    if (filesToConvert.length === 0) {
      setError(`Please select at least one file to convert.`);
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
        title={fileUploadTitle}
        accept={acceptedMimeTypes}
        description={fileTypeDescription}
      />
    );
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">{pageTitle}</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">
                {pageDescription}
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
                <p className="text-xl text-white mt-4">Converting files to PDF...</p>
                <p className="text-md text-gray-300 mt-2">{progressMessage}</p>
            </div>
            )}
            {renderContent()}
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFilesChange(e.target.files)}
                accept={acceptedMimeTypes}
                multiple
                className="hidden"
            />
        </div>
    </div>
  );
};
