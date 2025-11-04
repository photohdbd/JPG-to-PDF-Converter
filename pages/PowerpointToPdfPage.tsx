import React, { useState, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { callStirlingApi } from '../utils';

interface PowerpointToPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const PowerpointToPdfPage: React.FC<PowerpointToPdfPageProps> = ({ onNavigate }) => {
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

    setIsConverting(true);
    setError(null);
    setProgress('Initializing...');

    try {
        const formData = new FormData();
        formData.append('file', file);
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
  };
  
  const reset = () => {
    setIsConverting(false);
    if(pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setError(null);
    setProgress('');
    setDownloadName('');
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">PowerPoint to PDF Converter</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl text-center">
                Convert your PowerPoint (.pptx) presentations into a high-quality PDF document.
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
            {isConverting && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Converting Presentation...</p>
                <p className="text-md text-gray-300 mt-2">{progress}</p>
            </div>
            )}

            {pdfUrl ? (
                <DownloadScreen files={[{ url: pdfUrl, name: downloadName }]} onStartOver={reset} />
            ) : (
                <FileUpload 
                    onFilesSelect={handleFileChange}
                    title="Drag & Drop Your PowerPoint File Here"
                    accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    description="Supports .pptx files. Classic .ppt format is not supported."
                />
            )}
        </div>
    </div>
  );
};