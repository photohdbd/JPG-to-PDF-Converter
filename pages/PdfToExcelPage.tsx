import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const pdfjsLib: any;

interface PdfToExcelPageProps {
  onNavigate: (page: Page) => void;
}

export const PdfToExcelPage: React.FC<PdfToExcelPageProps> = ({ onNavigate }) => {
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
    setFileName(file.name.replace(/\.pdf$/i, '_LOLOPDF.csv'));
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let csvContent = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Simple coordinate-based text to CSV conversion
        const lines: { y: number; items: { x: number; str: string }[] }[] = [];
        const Y_TOLERANCE = 5;

        textContent.items.forEach((item: any) => {
          const y = item.transform[5];
          const x = item.transform[4];
          let line = lines.find(l => Math.abs(l.y - y) < Y_TOLERANCE);
          if (!line) {
            line = { y, items: [] };
            lines.push(line);
          }
          line.items.push({ x, str: item.str });
        });

        lines.sort((a, b) => b.y - a.y); // Sort lines from top to bottom
        
        lines.forEach(line => {
          line.items.sort((a, b) => a.x - b.x); // Sort items in line from left to right
          const lineText = line.items.map(item => `"${item.str.replace(/"/g, '""')}"`).join(',');
          csvContent += lineText + '\n';
        });
        csvContent += '\n'; // Add a blank line between pages
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">PDF to Excel Converter</h1>
            <p className="text-md md:text-lg text-gray-400 mb-8 max-w-2xl text-center">
                Extract data from your PDF files into editable Excel spreadsheets (.csv). Ideal for data extraction and analysis of tables.
            </p>
            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-2xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="block sm:inline"><b>Note:</b> This tool works best with text-based PDFs and simple table structures. Scanned documents or complex layouts may not convert accurately.</span>
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
                <p className="text-xl text-white mt-4">Extracting data to CSV...</p>
            </div>
            )}
            
            {resultUrl ? (
                <DownloadScreen files={[{ url: resultUrl, name: fileName }]} onStartOver={reset} autoDownload={true}/>
            ) : (
                <PdfUpload onFilesSelect={handleFileChange} multiple={false} />
            )}
        </div>
    </div>
  );
};