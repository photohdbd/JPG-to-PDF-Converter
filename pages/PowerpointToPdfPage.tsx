import React, { useState, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, PowerpointIcon, ArrowRightIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { callStirlingApi } from '../utils';

interface PowerpointToPdfPageProps {
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

export const PowerpointToPdfPage: React.FC<PowerpointToPdfPageProps> = ({ onNavigate }) => {
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [downloadName, setDownloadName] = useState('');

  useEffect(() => {
    return () => {
        if(pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);


  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    reset();
    const file = files[0];
    
    if (files.length > 1) {
        setError("Please select only one file. The first file has been chosen.");
    }
    
    const fileName = file.name.toLowerCase();
    const isPptx = fileName.endsWith('.pptx') || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    const isPpt = fileName.endsWith('.ppt') || file.type === 'application/vnd.ms-powerpoint';

    if (isPpt) {
      setError("Unsupported .ppt format. Please re-save your presentation as a modern .pptx file and try again.");
      return;
    }

    if (!isPptx) {
      setError("Invalid file type. Please upload a .pptx file.");
      return;
    }

    setPptFile(file);
  };
  
  const handleConvert = async () => {
    if (!pptFile) return;

    setIsConverting(true);
    setError(null);
    setProgress('Initializing...');

    try {
        const formData = new FormData();
        formData.append('file', pptFile);
        const { blob, filename } = await callStirlingApi('/api/v1/general/convert-to-pdf', formData, setProgress);
        
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setDownloadName(filename);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to convert presentation. The file may be corrupt or in an unsupported format.");
    } finally {
        setIsConverting(false);
        setProgress('');
    }
  }

  const reset = () => {
    setPptFile(null);
    setIsConverting(false);
    if(pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setError(null);
    setProgress('');
    setDownloadName('');
  };
  
  const renderContent = () => {
    if (pdfUrl) {
      return <DownloadScreen files={[{ url: pdfUrl, name: downloadName }]} onStartOver={reset} />;
    }
    
    if (pptFile) {
        return (
             <div className="w-full max-w-lg">
                <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8 text-center">
                    <PowerpointIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <p className="font-bold text-black dark:text-white truncate mb-1" title={pptFile.name}>{pptFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{formatBytes(pptFile.size)}</p>
                    
                     <div className="flex gap-4">
                        <button onClick={reset} className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleConvert} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary transition-colors">
                            Convert to PDF <ArrowRightIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <FileUpload 
            onFilesSelect={handleFileChange}
            title="Drag & Drop Your PowerPoint File Here"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            description="Supports .pptx files. Classic .ppt format is not supported."
        />
    )
  }

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">PowerPoint to PDF Converter</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl text-center">
                Convert your PowerPoint (.pptx) presentations into a high-quality PDF document.
            </p>
            {error && (
            <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-lg flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <span className="text-xl">×</span>
                </button>
            </div>
            )}
            {isConverting && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Converting Presentation...</p>
                <p className="text-md text-gray-300 mt-2">{progress}</p>
            </div>
            )}
            {renderContent()}
        </div>
    </div>
  );
};