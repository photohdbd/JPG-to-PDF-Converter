import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { DocxPreviewGrid } from '../components/DocxPreviewGrid';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { callStirlingApi } from '../utils';

export type DocxFile = {
  id: string;
  file: File;
  status: 'supported' | 'unsupported';
};

interface WordToPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const WordToPdfPage: React.FC<WordToPdfPageProps> = ({ onNavigate }) => {
  const [docxFiles, setDocxFiles] = useState<DocxFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFilesChange = async (files: FileList | null) => {
    if (!files) return;

    setError(null);
    const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const docMimeType = 'application/msword';
    const docxExtension = '.docx';
    const docExtension = '.doc';

    let unsupportedDocCount = 0;

    const mappedFiles = Array.from(files).map(file => {
      const fileNameLower = file.name.toLowerCase();
      const isDocx = file.type === docxMimeType || fileNameLower.endsWith(docxExtension);
      const isDoc = file.type === docMimeType || fileNameLower.endsWith(docExtension);

      if (isDocx) {
        return {
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
          status: 'supported' as const,
        };
      }
      if (isDoc) {
        unsupportedDocCount++;
        return {
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
          status: 'unsupported' as const,
        };
      }
      return null;
    });

    const newFiles = mappedFiles.filter((f): f is DocxFile => f !== null);
    
    const rejectedCount = files.length - newFiles.length;

    const errorParts = [];
    if (rejectedCount > 0) {
      errorParts.push(`${rejectedCount} file(s) were not valid Word documents and were ignored.`);
    }
    if (unsupportedDocCount > 0) {
        errorParts.push(`${unsupportedDocCount} .doc file(s) were ignored. The classic .doc format isn't supported. Please re-save them as modern .docx files first.`);
    }
    
    if (errorParts.length > 0) {
      setError(errorParts.join(' '));
    }
    
    if (newFiles.length > 0) {
      setDocxFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleConvertToPdf = useCallback(async () => {
    const filesToConvert = docxFiles.filter(f => f.status === 'supported');
    if (filesToConvert.length === 0) {
      setError("Please select at least one supported .docx file to convert.");
      return;
    }

    setIsConverting(true);
    setError(null);
    setProgressMessage('Initializing...');

    try {
      const formData = new FormData();
      filesToConvert.forEach(docxFile => {
        formData.append('file', docxFile.file);
      });

      const { blob, filename } = await callStirlingApi('/api/v1/general/convert-to-pdf', formData, setProgressMessage);
      
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setDownloadName(filename);
      setDocxFiles([]);
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred during conversion.");
    } finally {
      setIsConverting(false);
      setProgressMessage('');
    }
  }, [docxFiles]);

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setDocxFiles([]);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setDownloadName('');
    setError(null);
    setIsConverting(false);
    setProgressMessage('');
  };

  const renderContent = () => {
    if (pdfUrl) {
      return <DownloadScreen files={[{url: pdfUrl, name: downloadName}]} onStartOver={reset} autoDownload={true} />;
    }

    if (docxFiles.length > 0) {
      return (
        <DocxPreviewGrid
          docxFiles={docxFiles}
          setDocxFiles={setDocxFiles}
          isProcessing={isConverting}
          onProcess={handleConvertToPdf}
          onAddMore={handleAddMoreFiles}
          onClearAll={reset}
          processButtonText="Convert to PDF"
        />
      );
    }

    const acceptTypes = ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return (
        <FileUpload 
            onFilesSelect={handleFilesChange}
            title="Drag & Drop Your Word Files Here"
            accept={acceptTypes}
            description="Supports modern .docx files. Older .doc files are not supported and will be ignored."
        />
    );
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Word to PDF Converter</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl text-center">
                Convert Microsoft Word (.docx) documents to high-quality PDF files that preserve formatting.
            </p>
            {error && (
            <div className="bg-yellow-300/50 dark:bg-yellow-900/50 border border-yellow-500 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-4xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <span className="text-xl">×</span>
                </button>
            </div>
            )}
            {isConverting && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Converting to PDF...</p>
                <p className="text-md text-gray-300 mt-2">{progressMessage}</p>
            </div>
            )}
            {renderContent()}
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFilesChange(e.target.files)}
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                className="hidden"
            />
        </div>
    </div>
  );
};