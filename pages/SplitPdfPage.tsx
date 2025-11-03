import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { PdfPagePreviewGrid } from '../components/PdfPagePreviewGrid';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const PDFLib: any;
declare const pdfjsLib: any;

type PdfFileState = {
  file: File;
  arrayBuffer: ArrayBuffer;
};

export type PageData = {
  pageNum: number;
  dataUrl: string;
  selected: boolean;
};

interface SplitPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const SplitPdfPage: React.FC<SplitPdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<PdfFileState | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitPdfUrl, setSplitPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (splitPdfUrl) {
        URL.revokeObjectURL(splitPdfUrl);
      }
      pages.forEach(p => URL.revokeObjectURL(p.dataUrl));
    };
  }, [splitPdfUrl, pages]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    reset();
    const file = files[0];
    
    if (files.length > 1) {
        setError("Please select only one PDF file at a time. The first file has been selected.");
    } else {
        setError(null);
    }
    
    if (file.type !== 'application/pdf') {
      setError("The selected file is not a PDF. Please choose a valid PDF file.");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        setPdfFile({ file, arrayBuffer });
        await renderPdfPages(arrayBuffer);
      } catch (err) {
        console.error(err);
        setError("Could not read the PDF file. It might be corrupted or password-protected.");
        reset();
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
        setError("Failed to read the file.");
        setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const renderPdfPages = async (arrayBuffer: ArrayBuffer) => {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const newPages: PageData[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if(context){
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        newPages.push({
            pageNum: i,
            dataUrl: canvas.toDataURL('image/jpeg'),
            selected: false,
        });
      }
    }
    setPages(newPages);
  };
  
  const handleTogglePageSelect = (pageNumToToggle: number) => {
    setPages(prevPages =>
      prevPages.map(page =>
        page.pageNum === pageNumToToggle ? { ...page, selected: !page.selected } : page
      )
    );
  };
  
  const handleInvertSelection = () => {
    setPages(prevPages => prevPages.map(page => ({ ...page, selected: !page.selected })));
  };
  
  const handleClearSelection = () => {
     setPages(prevPages => prevPages.map(page => ({ ...page, selected: false })));
  };

  const handleSplitPdf = async () => {
    if (!pdfFile) return;

    const pagesToKeepIndices = pages
      .filter(p => !p.selected)
      .map(p => p.pageNum - 1);

    if (pagesToKeepIndices.length === pages.length) {
      setError("Please select at least one page to remove.");
      return;
    }
    if (pagesToKeepIndices.length === 0) {
      setError("You cannot remove all pages from the document.");
      return;
    }

    setIsSplitting(true);
    setError(null);
    try {
      const { PDFDocument } = PDFLib;
      const originalPdfDoc = await PDFDocument.load(pdfFile.arrayBuffer);
      const newPdfDoc = await PDFDocument.create();
      const copiedPages = await newPdfDoc.copyPages(originalPdfDoc, pagesToKeepIndices);
      copiedPages.forEach(page => newPdfDoc.addPage(page));
      
      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setSplitPdfUrl(url);
    } catch (err) {
      console.error(err);
      setError("An error occurred while creating the new PDF.");
    } finally {
      setIsSplitting(false);
    }
  };

  const reset = () => {
    setPdfFile(null);
    setPages([]);
    setSplitPdfUrl(null);
    setError(null);
    setIsProcessing(false);
    setIsSplitting(false);
  };

  const renderContent = () => {
    if (splitPdfUrl) {
      return <DownloadScreen files={[{url: splitPdfUrl, name: "split.pdf"}]} onStartOver={reset} />;
    }
    if (pages.length > 0) {
      return (
        <PdfPagePreviewGrid
          pages={pages}
          onTogglePageSelect={handleTogglePageSelect}
          onProcess={handleSplitPdf}
          onReset={reset}
          onInvertSelection={handleInvertSelection}
          onClearSelection={handleClearSelection}
          isProcessing={isSplitting}
        />
      );
    }
    return <PdfUpload onFilesSelect={handleFileChange} />;
  };

  return (
    <div className="w-full max-w-6xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Split PDF</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">
                Remove one or more pages from a PDF document. Click on pages to select them for removal.
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
            {(isProcessing || isSplitting) && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">
                {isProcessing ? "Rendering PDF pages..." : "Creating your new PDF..."}
                </p>
            </div>
            )}
            {renderContent()}
        </div>
    </div>
  );
};