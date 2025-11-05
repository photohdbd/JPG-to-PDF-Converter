import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, RefreshCwIcon, RotateCcwIcon, RotateCwIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { useUsage } from '../contexts/UsageContext';

declare const pdfjsLib: any;
declare const jspdf: any;

interface PagePreview {
  dataUrl: string;
  rotation: 0 | 90 | 180 | 270;
}

interface RotatePdfPageProps {
  onNavigate: (page: Page) => void;
}

export const RotatePdfPage: React.FC<RotatePdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File; arrayBuffer: ArrayBuffer } | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const { incrementConversions } = useUsage();

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
          pageData.push({ dataUrl: canvas.toDataURL(), rotation: 0 });
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
    if (!pdfFile) return;
    setIsProcessing(true);
    setProgressMessage("Applying rotation...");
    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF({ orientation: 'p', unit: 'px', hotfixes: ['px_scaling'] });
      
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfFile.arrayBuffer) }).promise;
      
      for(let i=1; i <= pdf.numPages; i++) {
        setProgressMessage(`Processing page ${i} of ${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Canvas context not available.");

        await page.render({canvasContext: context, viewport }).promise;
        const imgData = canvas.toDataURL('image/jpeg');
        
        const pageRotation = pages[i - 1].rotation;
        const needsSwap = pageRotation === 90 || pageRotation === 270;
        const pageWidth = needsSwap ? canvas.height : canvas.width;
        const pageHeight = needsSwap ? canvas.width : canvas.height;

        if (i > 1) {
          doc.addPage([pageWidth, pageHeight]);
        } else {
          const page1 = doc.internal.pages[1];
          page1.width = pageWidth;
          page1.height = pageHeight;
        }

        doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'NONE', pageRotation);
      }

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setDownloadName(pdfFile.file.name.replace(/\.pdf$/i, '_rotated.pdf'));
      incrementConversions();
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
    if(resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setDownloadName('');
    setError(null);
  };
  
  const handleRotateAll = (angle: 90 | 180 | 270) => {
    setPages(pages.map(p => ({...p, rotation: angle})))
  }
  
  const handleRotatePage = (index: number, direction: 'left' | 'right') => {
      setPages(prevPages => {
          const newPages = [...prevPages];
          const currentRotation = newPages[index].rotation;
          let newRotation;
          if (direction === 'left') {
              newRotation = (currentRotation - 90 + 360) % 360;
          } else { // right
              newRotation = (currentRotation + 90) % 360;
          }
          newPages[index].rotation = newRotation as PagePreview['rotation'];
          return newPages;
      });
  };

  const renderPages = () => (
     <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
            <span className="font-semibold text-black dark:text-white">Rotate all pages:</span>
            <div className="flex gap-2">
                <button onClick={() => handleRotateAll(270)} className="px-4 py-2 rounded font-semibold bg-gray-300 dark:bg-gray-700 text-black dark:text-white hover:bg-brand-primary hover:text-white transition-colors">90° Left ↺</button>
                <button onClick={() => handleRotateAll(180)} className="px-4 py-2 rounded font-semibold bg-gray-300 dark:bg-gray-700 text-black dark:text-white hover:bg-brand-primary hover:text-white transition-colors">180°</button>
                <button onClick={() => handleRotateAll(90)} className="px-4 py-2 rounded font-semibold bg-gray-300 dark:bg-gray-700 text-black dark:text-white hover:bg-brand-primary hover:text-white transition-colors">90° Right ↻</button>
            </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {pages.map((page, index) => (
                <div key={index} className="relative group bg-white dark:bg-gray-800 p-2 rounded shadow-lg text-center transition-all">
                    <img src={page.dataUrl} alt={`Page ${index + 1}`} className="w-full h-auto rounded mb-2 transition-transform duration-300" style={{ transform: `rotate(${page.rotation}deg)` }}/>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <button onClick={() => handleRotatePage(index, 'left')} className="p-2 bg-white/80 text-black rounded-full hover:bg-white" title="Rotate Left"><RotateCcwIcon className="w-5 h-5"/></button>
                       <button onClick={() => handleRotatePage(index, 'right')} className="p-2 bg-white/80 text-black rounded-full hover:bg-white" title="Rotate Right"><RotateCwIcon className="w-5 h-5"/></button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Page {index + 1}</p>
                </div>
            ))}
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-center gap-4 sticky bottom-4 shadow-2xl">
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-red-700 dark:bg-red-800 text-white font-semibold rounded-md hover:bg-red-600 dark:hover:bg-red-700 transition-colors">
                <RefreshCwIcon className="w-5 h-5"/> Start Over
            </button>
            <button onClick={handleProcess} className="px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary">
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
        <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">Rotate all pages in your PDF document, or rotate individual pages.</p>
        {error && <div className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded mb-4 w-full max-w-lg text-center"><AlertTriangleIcon className="inline w-5 h-5 mr-2" />{error}</div>}
        {isProcessing && <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50"><LoaderIcon /><p className="text-xl text-white mt-4">{progressMessage}</p></div>}

        {resultUrl ? <DownloadScreen files={[{url: resultUrl, name: downloadName}]} onStartOver={reset} /> : !pdfFile ? <PdfUpload onFilesSelect={handleFileChange} multiple={false} /> : renderPages()}
      </div>
    </div>
  );
};
