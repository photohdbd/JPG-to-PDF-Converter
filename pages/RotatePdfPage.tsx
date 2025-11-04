import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, RefreshCwIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { callStirlingApi } from '../utils';

declare const pdfjsLib: any;

interface PagePreview {
  dataUrl: string;
}

interface RotatePdfPageProps {
  onNavigate: (page: Page) => void;
}

export const RotatePdfPage: React.FC<RotatePdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File; arrayBuffer: ArrayBuffer } | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');

  useEffect(() => {
     if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    reset();
    const file = files[0];
    if (file.type !== 'application/pdf') return setError("Please select a valid PDF file.");
    
    setIsProcessing(true);
    setProgressMessage("Rendering thumbnails...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfFile({ file, arrayBuffer });
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const pageData: PagePreview[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext('2d');
        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          pageData.push({ dataUrl: canvas.toDataURL() });
        }
      }
      setPages(pageData);
    } catch (e) {
      setError("Could not read PDF. It may be corrupt or protected.");
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  };

  const handleProcess = async () => {
    if (!pdfFile || rotation === 0) {
        setError("Please select a rotation angle other than 0.");
        return;
    };
    setIsProcessing(true);
    setProgressMessage("Applying rotation...");
    try {
      const formData = new FormData();
      formData.append('file', pdfFile.file);
      formData.append('rotation', String(rotation));

      const { blob, filename } = await callStirlingApi('/api/v1/general/rotate', formData, setProgressMessage);
      
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setDownloadName(filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to rotate PDF.");
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  };

  const reset = () => {
    setPdfFile(null);
    pages.forEach(p => URL.revokeObjectURL(p.dataUrl));
    setPages([]);
    setRotation(0);
    if(resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setDownloadName('');
    setError(null);
  };
  
  const renderPages = () => (
     <div className="w-full">
        <div className="flex justify-center items-center gap-4 mb-6 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
            <span className="font-semibold">Rotate all pages:</span>
            <button onClick={() => setRotation(90)} className={`px-4 py-2 rounded font-semibold ${rotation === 90 ? 'bg-brand-primary text-white' : 'bg-gray-300 dark:bg-gray-700'}`}>90° Left ↺</button>
            <button onClick={() => setRotation(180)} className={`px-4 py-2 rounded font-semibold ${rotation === 180 ? 'bg-brand-primary text-white' : 'bg-gray-300 dark:bg-gray-700'}`}>180°</button>
            <button onClick={() => setRotation(270)} className={`px-4 py-2 rounded font-semibold ${rotation === 270 ? 'bg-brand-primary text-white' : 'bg-gray-300 dark:bg-gray-700'}`}>90° Right ↻</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {pages.map((page, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg text-center">
                    <img src={page.dataUrl} alt={`Page ${index + 1}`} className="w-full h-auto rounded mb-2 transition-transform duration-300" style={{ transform: `rotate(${rotation}deg)` }}/>
                    <p className="text-sm">Page {index + 1}</p>
                </div>
            ))}
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-center gap-4 sticky bottom-4 shadow-2xl">
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-red-700 dark:bg-red-800 text-white font-semibold rounded-md hover:bg-red-600 dark:hover:bg-red-700 transition-colors">
                <RefreshCwIcon className="w-5 h-5"/> Start Over
            </button>
            <button onClick={handleProcess} className="px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary disabled:bg-gray-500" disabled={rotation === 0}>
                Apply Changes & Download
            </button>
        </div>
     </div>
  );

  return (
    <div className="w-full max-w-6xl flex flex-col">
      <BackButton onClick={() => onNavigate('home')} />
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Rotate PDF</h1>
        <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">Rotate all pages in your PDF document.</p>
        {error && <div className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded mb-4 w-full max-w-lg text-center"><AlertTriangleIcon className="inline w-5 h-5 mr-2" />{error}</div>}
        {isProcessing && <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50"><LoaderIcon /><p className="text-xl text-white mt-4">{progressMessage}</p></div>}

        {resultUrl ? <DownloadScreen files={[{url: resultUrl, name: downloadName}]} onStartOver={reset} /> : !pdfFile ? <PdfUpload onFilesSelect={handleFileChange} multiple={false} /> : renderPages()}
      </div>
    </div>
  );
};