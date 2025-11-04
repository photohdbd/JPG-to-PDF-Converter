import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, RotateIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const PDFLib: any;
declare const pdfjsLib: any;

interface RotatedPage {
  dataUrl: string;
  rotation: number;
}

interface RotatePdfPageProps {
  onNavigate: (page: Page) => void;
}

export const RotatePdfPage: React.FC<RotatePdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File; arrayBuffer: ArrayBuffer } | null>(null);
  const [pages, setPages] = useState<RotatedPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfFile({ file, arrayBuffer });
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const pageData: RotatedPage[] = [];
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
    }
  };

  const handleRotate = (index: number, angle: number) => {
    setPages(prev => prev.map((p, i) => i === index ? { ...p, rotation: (p.rotation + angle + 360) % 360 } : p));
  };
  
  const handleRotateAll = (angle: number) => {
    setPages(prev => prev.map(p => ({ ...p, rotation: (p.rotation + angle + 360) % 360 })));
  };

  const handleProcess = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    try {
      const { PDFDocument, degrees } = PDFLib;
      const pdfDoc = await PDFDocument.load(pdfFile.arrayBuffer);
      pages.forEach((page, index) => {
        if (page.rotation !== 0) {
          const pdfPage = pdfDoc.getPage(index);
          const currentRotation = pdfPage.getRotation().angle;
          pdfPage.setRotation(degrees(currentRotation + page.rotation));
        }
      });
      
      const baseName = pdfFile.file.name.replace(/\.[^/.]+$/, "");
      setDownloadName(`${baseName}_rotated_LOLOPDF.pdf`);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError("Failed to rotate PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPdfFile(null);
    setPages([]);
    setResultUrl(null);
    setDownloadName('');
    setError(null);
  };
  
  const renderPages = () => (
     <div className="w-full">
        <div className="flex justify-center gap-4 mb-4">
            <button onClick={() => handleRotateAll(90)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold">Rotate All Left</button>
            <button onClick={() => handleRotateAll(-90)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold">Rotate All Right</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {pages.map((page, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg text-center">
                    <img src={page.dataUrl} alt={`Page ${index + 1}`} className="w-full h-auto rounded mb-2" style={{ transform: `rotate(${page.rotation}deg)` }}/>
                    <p className="text-sm mb-2">Page {index + 1}</p>
                    <button onClick={() => handleRotate(index, 90)} className="p-1 text-sm bg-gray-200 dark:bg-gray-700 rounded mr-1 hover:bg-gray-300 dark:hover:bg-gray-600" title="Rotate Left">↺</button>
                    <button onClick={() => handleRotate(index, -90)} className="p-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600" title="Rotate Right">↻</button>
                </div>
            ))}
        </div>
        <div className="text-center">
            <button onClick={handleProcess} className="px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary">Apply Changes</button>
        </div>
     </div>
  );

  return (
    <div className="w-full max-w-6xl flex flex-col">
      <BackButton onClick={() => onNavigate('home')} />
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Rotate PDF</h1>
        <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">Rotate specific pages or all pages in your PDF document.</p>
        {error && <div className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded mb-4 w-full max-w-lg text-center"><AlertTriangleIcon className="inline w-5 h-5 mr-2" />{error}</div>}
        {isProcessing && <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50"><LoaderIcon /><p className="text-xl text-white mt-4">Processing...</p></div>}

        {resultUrl ? <DownloadScreen files={[{url: resultUrl, name: downloadName}]} onStartOver={reset} /> : !pdfFile ? <PdfUpload onFilesSelect={handleFileChange} multiple={false} /> : renderPages()}
      </div>
    </div>
  );
};