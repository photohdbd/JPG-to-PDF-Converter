import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, DownloadIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const pdfjsLib: any;
declare const JSZip: any;

interface JpgResult {
  url: string;
  name: string;
}

interface PdfToJpgPageProps {
  onNavigate: (page: Page) => void;
}

export const PdfToJpgPage: React.FC<PdfToJpgPageProps> = ({ onNavigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [results, setResults] = useState<JpgResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);

  useEffect(() => {
    return () => {
      results.forEach(result => URL.revokeObjectURL(result.url));
    };
  }, [results]);

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
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const newResults: JpgResult[] = [];
      const baseName = file.name.replace(/\.pdf$/i, '');

      for (let i = 1; i <= numPages; i++) {
        setProgress(`Converting page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const blob = await (await fetch(dataUrl)).blob();
          newResults.push({
            url: URL.createObjectURL(blob),
            name: `${baseName}-page-${i}.jpg`,
          });
        }
      }
      setResults(newResults);
    } catch (err) {
      console.error(err);
      setError("Could not process the PDF. It might be corrupted or password-protected.");
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    setIsZipping(true);
    try {
        const zip = new JSZip();
        const baseName = results[0].name.replace(/-page-1\.jpg$/i, '');

        await Promise.all(results.map(async (result) => {
            const response = await fetch(result.url);
            const blob = await response.blob();
            zip.file(result.name, blob);
        }));

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);

        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = `${baseName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(zipUrl);

    } catch (err) {
        console.error("Failed to create zip file", err);
        setError("Sorry, there was an issue creating the zip file.");
    } finally {
        setIsZipping(false);
    }
  };
  
  const reset = () => {
    setIsProcessing(false);
    setIsZipping(false);
    setResults([]);
    setError(null);
    setProgress('');
  };

  const renderResults = () => (
    <div className="w-full max-w-6xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {results.map(result => (
                <div key={result.name} className="relative group bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                    <img src={result.url} alt={result.name} className="w-full h-48 object-contain" />
                    <div className="p-2 text-xs text-gray-300 truncate" title={result.name}>{result.name}</div>
                    <a href={result.url} download={result.name} className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <DownloadIcon className="w-8 h-8 text-white" />
                    </a>
                </div>
            ))}
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-center gap-4 sticky bottom-4">
             <button onClick={reset} className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors">
                Convert Another PDF
            </button>
            <button
                onClick={handleDownloadAll}
                disabled={isZipping}
                className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {isZipping ? 'Zipping...' : 'Download All as .zip'}
            </button>
        </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">PDF to JPG Converter</h1>
            <p className="text-md md:text-lg text-gray-400 mb-8 max-w-xl text-center">
                Convert each page of your PDF into high-quality JPG images. Free, fast, and easy to use.
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
                <LoaderIcon className="w-16 h-16 animate-spin text-brand-primary" />
                <p className="text-xl text-white mt-4">Converting PDF to JPG...</p>
                <p className="text-md text-gray-300 mt-2">{progress}</p>
            </div>
            )}
            {results.length > 0 ? renderResults() : <PdfUpload onFilesSelect={handleFileChange} multiple={false} />}
        </div>
    </div>
  );
};