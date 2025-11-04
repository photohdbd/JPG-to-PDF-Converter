import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { callStirlingApi } from '../utils';

interface PdfToPowerpointPageProps {
  onNavigate: (page: Page) => void;
}

export const PdfToPowerpointPage: React.FC<PdfToPowerpointPageProps> = ({ onNavigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [downloadName, setDownloadName] = useState('');

  useEffect(() => {
    return () => {
      if(resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    reset();
    const file = files[0];
    
    if (file.type !== 'application/pdf') {
      setError("The selected file is not a PDF. Please choose a valid PDF file.");
      return;
    }

    setIsProcessing(true);
    setProgress('Initializing...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { blob, filename } = await callStirlingApi('/api/v1/convert/pdf-to-powerpoint', formData, setProgress);
      
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setDownloadName(filename);
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not process the PDF. It might be corrupted or password-protected.");
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };
  
  const reset = () => {
    setIsProcessing(false);
    if(resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setError(null);
    setProgress('');
    setDownloadName('');
  };

  return (
    <div className="w-full max-w-6xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">PDF to PowerPoint Converter</h1>
            <p className="text-md md:text-lg text-gray-400 mb-8 max-w-xl text-center">
                Convert your PDF into an editable PowerPoint (.pptx) presentation.
            </p>
            {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-4xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <span className="text-xl">×</span>
                </button>
            </div>
            )}
            {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Creating your presentation...</p>
                <p className="text-md text-gray-300 mt-2">{progress}</p>
            </div>
            )}
            {resultUrl ? (
                <DownloadScreen files={[{ url: resultUrl, name: downloadName }]} onStartOver={reset} autoDownload={true}/>
            ) : (
                <PdfUpload onFilesSelect={handleFileChange} multiple={false} />
            )}
        </div>
    </div>
  );
};