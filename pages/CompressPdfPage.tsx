import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { CompressionOptions } from '../components/CompressionOptions';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, ArrowRightIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { callStirlingApi } from '../utils';

type PdfFileState = {
  file: File;
};

export type CompressionLevel = 'recommended' | 'high' | 'extreme';

type ResultState = {
  url: string;
  name: string;
  originalSize: number;
  newSize: number;
};

interface CompressPdfPageProps {
  onNavigate: (page: Page) => void;
}

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const CompressPdfPage: React.FC<CompressPdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<PdfFileState | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    reset();
    const file = files[0];

    if (files.length > 1) {
      setError("Please select only one PDF file. The first file has been used.");
    } else {
      setError(null);
    }
    
    if (file.type !== 'application/pdf') {
      setError("The selected file is not a PDF. Please choose a valid PDF file.");
      return;
    }
    setPdfFile({ file });
  };

  const handleCompressPdf = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    setError(null);
    setProcessingProgress('Initializing...');

    try {
      const getApiLevel = (): string => {
        switch (compressionLevel) {
          case 'recommended': return '3'; // Moderate
          case 'high': return '2'; // High
          case 'extreme': return '1'; // Highest
          default: return '3';
        }
      };

      const formData = new FormData();
      formData.append('file', pdfFile.file);
      formData.append('compressionLevel', getApiLevel());

      const { blob, filename } = await callStirlingApi('/compress', formData, setProcessingProgress);

      const url = URL.createObjectURL(blob);
      setResult({
        url,
        name: filename,
        originalSize: pdfFile.file.size,
        newSize: blob.size,
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? `Compression failed: ${err.message}` : "An unknown error occurred during compression.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress('');
      setPdfFile(null);
    }
  };

  const reset = () => {
    setPdfFile(null);
    if(result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setError(null);
    setIsProcessing(false);
    setProcessingProgress('');
    setCompressionLevel('recommended');
  };

  const renderContent = () => {
    if (result) {
      const reduction = Math.round(((result.originalSize - result.newSize) / result.originalSize) * 100);
      const details = (
        <div className="space-y-2">
            <p><strong>Original Size:</strong> <span className="font-mono">{formatBytes(result.originalSize)}</span></p>
            <p><strong>New Size:</strong> <span className="font-mono text-green-600 dark:text-green-400">{formatBytes(result.newSize)}</span></p>
            <p><strong>Reduction:</strong> <span className="font-mono font-bold text-green-600 dark:text-green-400">{reduction > 0 ? `${reduction}%` : '< 1%'}</span></p>
        </div>
      );
      return <DownloadScreen files={[{url: result.url, name: result.name}]} onStartOver={reset} details={details} autoDownload={true} />;
    }

    if (pdfFile) {
      return (
        <div className="w-full max-w-4xl">
          <CompressionOptions
            fileName={pdfFile.file.name}
            fileSize={formatBytes(pdfFile.file.size)}
            level={compressionLevel}
            setLevel={setCompressionLevel}
          />
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleCompressPdf}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary transition-all duration-300 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
            >
              Compress PDF <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
    }

    return <PdfUpload onFilesSelect={handleFileChange} multiple={false} />;
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Compress PDF</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">
                Reduce the file size of your PDF while optimizing for the best quality.
            </p>
            {error && (
                <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-4xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <span className="text-xl">&times;</span>
                </button>
                </div>
            )}
            {isProcessing && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Compressing PDF...</p>
                <p className="text-md text-gray-300 mt-2">{processingProgress}</p>
                </div>
            )}
            {renderContent()}
        </div>
    </div>
  );
};