import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const pdfjsLib: any;

interface PdfToWordPageProps {
  onNavigate: (page: Page) => void;
}

export const PdfToWordPage: React.FC<PdfToWordPageProps> = ({ onNavigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);
  
  useEffect(() => {
      return () => {
          if (resultUrl) URL.revokeObjectURL(resultUrl);
      }
  }, [resultUrl]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    reset();
    const file = files[0];
    
    if (file.type !== 'application/pdf') {
      setError("The selected file is not a PDF. Please choose a valid PDF file.");
      return;
    }
    setFileName(file.name.replace(/\.pdf$/i, '.doc'));
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      const blob = new Blob([fullText], { type: 'application/msword' });
      setResultUrl(URL.createObjectURL(blob));

    } catch (err) {
      console.error(err);
      setError("Could not process the PDF. It might be corrupted or password-protected.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const reset = () => {
    setIsProcessing(false);
    setResultUrl(null);
    setError(null);
    setFileName('');
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">PDF to Word Converter</h1>
            <p className="text-md md:text-lg text-gray-400 mb-8 max-w-2xl text-center">
                Convert your PDFs to editable Word documents. Extracts text quickly for easy editing.
            </p>
             <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-2xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="block sm:inline"><b>Note:</b> This tool performs text extraction. Complex formatting, tables, and images from the original PDF will not be preserved.</span>
            </div>
            {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-2xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <span className="text-xl">×</span>
                </button>
            </div>
            )}
            {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon className="w-16 h-16 animate-spin text-brand-primary" />
                <p className="text-xl text-white mt-4">Extracting text...</p>
            </div>
            )}
            
            {resultUrl ? (
                <DownloadScreen pdfUrl={resultUrl} onStartOver={reset} fileName={fileName} autoDownload={true}/>
            ) : (
                <PdfUpload onFilesSelect={handleFileChange} multiple={false} />
            )}
        </div>
    </div>
  );
};
