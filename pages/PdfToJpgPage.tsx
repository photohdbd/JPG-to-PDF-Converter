import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const pdfjsLib: any;
declare const JSZip: any;

interface PdfToJpgPageProps {
  onNavigate: (page: Page) => void;
}

export const PdfToJpgPage: React.FC<PdfToJpgPageProps> = ({ onNavigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [downloadName, setDownloadName] = useState('');

  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
    return () => {
      if(resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    reset();
    const file = files[0];
    
    if (files.length > 1) {
        setError("Please select only one PDF file at a time.");
    }
    
    if (file.type !== 'application/pdf') {
      setError("The selected file is not a PDF. Please choose a valid PDF file.");
      return;
    }

    setIsProcessing(true);
    setProgress('Initializing...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      const zip = new JSZip();
      const imageBlobs: { name: string, blob: Blob }[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress(`Converting page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        
        if (blob) {
            zip.file(`page_${i}.jpg`, blob);
        }
      }

      setProgress('Zipping images...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const originalName = file.name.replace(/\.pdf$/i, '');

      setResultUrl(url);
      setDownloadName(`${originalName}_images.zip`);
      
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">PDF to JPG Converter</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">
                Convert each page of your PDF into high-quality JPG images. Free, fast, and easy to use.
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
            {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Converting PDF to JPG...</p>
                <p className="text-md text-gray-300 mt-2">{progress}</p>
            </div>
            )}
            {resultUrl ? (
                <DownloadScreen files={[{ url: resultUrl, name: downloadName }]} onStartOver={reset} autoDownload={true} />
            ) : <PdfUpload onFilesSelect={handleFileChange} multiple={false} />}
        </div>
    </div>
  );
};
