import React, { useState, useEffect, useRef } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, PlusIcon, RefreshCwIcon, TrashIcon, ArrowRightIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { callStirlingApi } from '../utils';

declare const pdfjsLib: any;

type PageRepresentation = {
  id: string;
  previewUrl: string; // data URL from canvas rendering
  sourceFile: File;
};

interface AddPagesToPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const AddPagesToPdfPage: React.FC<AddPagesToPdfPageProps> = ({ onNavigate }) => {
  const [pages, setPages] = useState<PageRepresentation[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
    return () => {
        pages.forEach(p => URL.revokeObjectURL(p.previewUrl));
        if (resultUrl) URL.revokeObjectURL(resultUrl);
    }
  }, []);

  const reset = () => {
    pages.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPages([]);
    setIsProcessing(false);
    setProcessingMessage('');
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setDownloadName('');
    setError(null);
  };
  
  const renderPdfToThumbnails = async (file: File): Promise<PageRepresentation[]> => {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const newPages: PageRepresentation[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProcessingMessage(`Rendering page ${i} of ${numPages} from ${file.name}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext('2d');
        
        if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            newPages.push({
                id: `page_${Date.now()}_${i}`,
                previewUrl: canvas.toDataURL(),
                sourceFile: file
            });
        }
      }
      return newPages;
  }
  
  const handleAddFiles = async (files: FileList | null) => {
    if (!files) return;
    setIsProcessing(true);
    
    let newPages: PageRepresentation[] = [];

    for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
            const previewUrl = URL.createObjectURL(file);
            newPages.push({
                id: `page_${Date.now()}_${file.name}`,
                previewUrl,
                sourceFile: file
            });
        } else if (file.type === 'application/pdf') {
            try {
                const renderedPages = await renderPdfToThumbnails(file);
                newPages = [...newPages, ...renderedPages];
            } catch (e) {
                setError(`Could not process ${file.name}. It may be corrupt or protected.`);
            }
        }
    }
    setPages(prev => [...prev, ...newPages]);
    setIsProcessing(false);
  }

  const handleSave = async () => {
    if (!pages.length) return;
    setIsProcessing(true);
    setProcessingMessage('Assembling new PDF...');
    try {
        const formData = new FormData();
        pages.forEach(page => {
            formData.append('file', page.sourceFile);
        });
        
        const { blob, filename } = await callStirlingApi('/api/v1/general/convert-to-pdf', formData, setProcessingMessage);
        
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setDownloadName(filename);
    } catch(e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "An error occurred while creating the PDF.");
    } finally {
        setIsProcessing(false);
    }
  }
  
  const handleRemovePage = (id: string) => {
      setPages(prev => prev.filter(p => {
          if (p.id === id) {
              URL.revokeObjectURL(p.previewUrl);
              return false;
          }
          return true;
      }));
  }
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => { dragItem.current = position; };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => { dragOverItem.current = position; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newPages = [...pages];
      const draggedItemContent = newPages.splice(dragItem.current, 1)[0];
      newPages.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setPages(newPages);
    }
  };

  const renderEditor = () => (
    <div className="w-full max-w-6xl">
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {pages.map((page, index) => (
                <div key={page.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                className="relative group bg-gray-200 dark:bg-gray-800 p-1 rounded-lg shadow-md cursor-grab active:cursor-grabbing">
                    <img src={page.previewUrl} alt={`Page preview ${index+1}`} className="w-full h-auto rounded-md" />
                     <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded">{index + 1}</div>
                    <button onClick={() => handleRemovePage(page.id)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
       </div>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-2xl">
            <div className="flex items-center gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    <PlusIcon className="w-5 h-5"/> Add Files
                </button>
                <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-red-700 dark:bg-red-800 text-white font-semibold rounded-md hover:bg-red-600 dark:hover:bg-red-700 transition-colors">
                    <RefreshCwIcon className="w-5 h-5"/> Reset
                </button>
            </div>
            <button onClick={handleSave} disabled={isProcessing} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary transition-all duration-300 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                Save PDF <ArrowRightIcon className="w-5 h-5"/>
            </button>
        </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl flex flex-col">
      <BackButton onClick={() => onNavigate('home')} />
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Add Pages to PDF</h1>
        <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl text-center">
          Upload your base PDF, then add more pages from images (JPG, PNG) or other PDFs. Drag to reorder.
        </p>
        
        {error && <div className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded mb-4 w-full flex items-center"><AlertTriangleIcon className="w-5 h-5 mr-2" />{error}<button onClick={() => setError(null)} className="ml-auto font-bold">X</button></div>}
        {isProcessing && <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50"><LoaderIcon /><p className="text-xl text-white mt-4">{processingMessage}</p></div>}
        
        {resultUrl ? <DownloadScreen files={[{ url: resultUrl, name: downloadName }]} onStartOver={reset} />
        : !pages.length ? <PdfUpload onFilesSelect={handleAddFiles} multiple={true} />
        : renderEditor()}

        <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleAddFiles(e.target.files)}
            accept="application/pdf,image/jpeg,image/png"
            multiple
            className="hidden"
        />
      </div>
    </div>
  );
};