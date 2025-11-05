import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { ImagePreviewGrid } from '../components/ImagePreviewGrid';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { useUsage } from '../contexts/UsageContext';

declare const jspdf: any;

export type AppFile = {
  id: string;
  file: File;
  type: 'image' | 'text' | 'unsupported';
  previewUrl?: string;
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
  const { incrementConversions } = useUsage();

  const acceptedTypesArray = acceptedMimeTypes.split(',').map(t => t.trim().toLowerCase());

  const isClientSideCompatible = React.useMemo(() => {
    const supportedFragments = ['image/', '.txt', '.csv', '.rtf', '.md', 'text/plain'];
    return acceptedTypesArray.some(type => 
        supportedFragments.some(s => type.includes(s))
    );
  }, [acceptedMimeTypes]);

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
          if (acceptedType.startsWith('.')) return fileNameLower.endsWith(acceptedType);
          if (acceptedType.endsWith('/*')) return fileTypeLower.startsWith(acceptedType.slice(0, -1));
          return fileTypeLower === acceptedType;
        });

        if (!isAccepted) {
            resolve(null);
            return;
        }

        const baseFile: Omit<AppFile, 'type'> = {
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
        };

        if (file.type.startsWith('image/')) {
          resolve({ ...baseFile, type: 'image', previewUrl: URL.createObjectURL(file) });
        } else {
          resolve({ ...baseFile, type: 'text' });
        }
      });
    });

    const newAppFiles = (await Promise.all(newFilesPromises)).filter((f): f is AppFile => f !== null);
    const rejectedCount = files.length - newAppFiles.length;

    if (rejectedCount > 0) {
      setError(`${rejectedCount} file(s) were of the wrong type and have been ignored.`);
    }
    
    if (newAppFiles.length > 0) {
      setAppFiles(prev => [...prev, ...newAppFiles]);
    }
  };

  const handleConvertToPdf = useCallback(async () => {
    if (!isClientSideCompatible) {
        setError("This file type requires server-side processing, which is not available in this demonstration. Only image and text conversions are supported.");
        return;
    }
    
    const filesToConvert = appFiles;
    if (filesToConvert.length === 0) {
      setError(`Please select at least one file to convert.`);
      return;
    }

    setIsConverting(true);
    setError(null);
    setProgressMessage('Initializing PDF...');

    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4', hotfixes: ['px_scaling'] });
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      for (let i = 0; i < filesToConvert.length; i++) {
        const appFile = filesToConvert[i];
        setProgressMessage(`Processing file ${i + 1}/${filesToConvert.length}: ${appFile.file.name}`);
        if (i > 0) doc.addPage();

        if (appFile.type === 'image') {
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              let imgWidth = pdfWidth;
              let imgHeight = pdfWidth / aspectRatio;
              if (imgHeight > pdfHeight) {
                imgHeight = pdfHeight;
                imgWidth = pdfHeight * aspectRatio;
              }
              const x = (pdfWidth - imgWidth) / 2;
              const y = (pdfHeight - imgHeight) / 2;
              doc.addImage(img.src, 'auto', x, y, imgWidth, imgHeight);
              resolve();
            };
            img.onerror = () => reject(new Error(`Could not load image: ${appFile.file.name}`));
            img.src = appFile.previewUrl!;
          });
        } else { // 'text'
            const text = await appFile.file.text();
            const margin = 40;
            const lines = doc.splitTextToSize(text, pdfWidth - 2 * margin);
            let y = margin;
            doc.setFontSize(12);
            lines.forEach((line: string) => {
              if (y > pdfHeight - margin) {
                doc.addPage();
                y = margin;
              }
              doc.text(line, margin, y);
              y += doc.getLineHeight();
            });
        }
      }

      setProgressMessage('Finalizing PDF...');
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setDownloadName('lolopdf_converted.pdf');
      incrementConversions(filesToConvert.length);
      setAppFiles([]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during PDF conversion.");
    } finally {
      setIsConverting(false);
      setProgressMessage('');
    }
  }, [appFiles, isClientSideCompatible, incrementConversions]);

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
