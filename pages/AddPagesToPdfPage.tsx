import React, { useState, useEffect, useRef } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, PlusIcon, XIcon, ArrowRightIcon, RefreshCwIcon, TrashIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const PDFLib: any;
declare const pdfjsLib: any;

type PageRepresentation = {
  id: string;
  previewUrl: string; // data URL from canvas rendering
  sourceType: 'original' | 'newImage' | 'newPdf';
  sourceData: {
    // For 'original' and 'newPdf'
    pdfArrayBuffer?: ArrayBuffer;
    pdfFileName?: string;
    pageIndex?: number; // 0-based index
    // For 'newImage'
    imageFile?: File;
  };
};

interface AddPagesToPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const AddPagesToPdfPage: React.FC<AddPagesToPdfPageProps> = ({ onNavigate }) => {
  const [initialPdf, setInitialPdf] = useState<{ file: File, arrayBuffer: ArrayBuffer } | null>(null);
  const [pages, setPages] = useState<PageRepresentation[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
    return () => {
        // Clean up object URLs
        pages.forEach(p => URL.revokeObjectURL(p.previewUrl));
        if (resultUrl) URL.revokeObjectURL(resultUrl);
    }
  }, []);

  const reset = () => {
    setInitialPdf(null);
    pages.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPages([]);
    setIsProcessing(false);
    setProcessingMessage('');
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setError(null);
  };
  
  const renderPdfToThumbnails = async (file: File, arrayBuffer: ArrayBuffer, sourceType: 'original' | 'newPdf'): Promise<PageRepresentation[]> => {
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const newPages: PageRepresentation[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProcessingMessage(`Rendering page ${i} of ${numPages}...`);
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
                sourceType,
                sourceData: {
                    pdfArrayBuffer: arrayBuffer,
                    pdfFileName: file.name,
                    pageIndex: i - 1
                }
            });
        }
      }
      return newPages;
  }

  const handleInitialFileChange = async (files: FileList | null) => {
    if (!files || !files.length) return;
    reset();
    const file = files[0];
    if (file.type !== 'application/pdf') return setError('Please select a valid PDF file.');
    
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      setInitialPdf({ file, arrayBuffer });
      const renderedPages = await renderPdfToThumbnails(file, arrayBuffer, 'original');
      setPages(renderedPages);
    } catch (e) {
      setError('Could not read PDF. It may be corrupt or password protected.');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };
  
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
                sourceType: 'newImage',
                sourceData: { imageFile: file }
            });
        } else if (file.type === 'application/pdf') {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const renderedPages = await renderPdfToThumbnails(file, arrayBuffer, 'newPdf');
                newPages = [...newPages, ...renderedPages];
            } catch (e) {
                setError(`Could not process ${file.name}. It may be corrupt or protected.`);
            }
        }
    }
    setPages(prev => [...prev, ...newPages]);
    setIsProcessing(false);
  }
  
  const convertToPng = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Could not get canvas context'));
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        resolve(await blob.arrayBuffer());
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                }, 'image/png');
            };
            img.onerror = (err) => reject(err);
            img.src = event.target?.result as string;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};

  const handleSave = async () => {
    if (!pages.length) return;
    setIsProcessing(true);
    setProcessingMessage('Assembling new PDF...');
    try {
        const { PDFDocument } = PDFLib;
        const finalPdfDoc = await PDFDocument.create();
        const loadedPdfs = new Map<string, any>();

        for (const [index, page] of pages.entries()) {
            setProcessingMessage(`Adding page ${index + 1} of ${pages.length}...`);
            const { sourceType, sourceData } = page;
            
            if (sourceType === 'original' || sourceType === 'newPdf') {
                const { pdfArrayBuffer, pdfFileName, pageIndex } = sourceData;
                let sourcePdfDoc = loadedPdfs.get(pdfFileName!);
                if (!sourcePdfDoc) {
                    sourcePdfDoc = await PDFDocument.load(pdfArrayBuffer!);
                    loadedPdfs.set(pdfFileName!, sourcePdfDoc);
                }
                const [copiedPage] = await finalPdfDoc.copyPages(sourcePdfDoc, [pageIndex!]);
                finalPdfDoc.addPage(copiedPage);
            } else if (sourceType === 'newImage') {
                const { imageFile } = sourceData;
                let imageBytes;
                if (imageFile!.type === 'image/webp') {
                    imageBytes = await convertToPng(imageFile!);
                } else {
                    imageBytes = await imageFile!.arrayBuffer();
                }

                const image = imageFile!.type.includes('png') || imageFile!.type === 'image/webp'
                    ? await finalPdfDoc.embedPng(imageBytes)
                    : await finalPdfDoc.embedJpg(imageBytes);
                
                const imagePage = finalPdfDoc.addPage([image.width, image.height]);
                imagePage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            }
        }

        const pdfBytes = await finalPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
    } catch(e) {
        console.error(e);
        setError("An error occurred while creating the PDF.");
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
  
  // Drag and drop handlers
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
          Upload your base PDF, then add more pages from images (JPG, PNG, WEBP) or other PDFs. Drag to reorder.
        </p>
        
        {error && <div className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded mb-4 w-full flex items-center"><AlertTriangleIcon className="w-5 h-5 mr-2" />{error}<button onClick={() => setError(null)} className="ml-auto font-bold">X</button></div>}
        {isProcessing && <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50"><LoaderIcon /><p className="text-xl text-white mt-4">{processingMessage}</p></div>}
        
        {resultUrl ? <DownloadScreen files={[{ url: resultUrl, name: 'combined.pdf' }]} onStartOver={reset} />
        : !initialPdf ? <PdfUpload onFilesSelect={handleInitialFileChange} multiple={false} />
        : renderEditor()}

        <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleAddFiles(e.target.files)}
            accept="application/pdf,image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
        />
      </div>
    </div>
  );
};
