import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { PdfPreviewGrid } from '../components/PdfPreviewGrid';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { useUsage } from '../contexts/UsageContext';

declare const pdfjsLib: any;
declare const jspdf: any;

export type PdfFile = {
  id: string;
  file: File;
};

interface MergePdfPageProps {
  onNavigate: (page: Page) => void;
}

export const MergePdfPage: React.FC<MergePdfPageProps> = ({ onNavigate }) => {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { incrementConversions } = useUsage();

  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
    return () => {
      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
      }
    };
  }, [mergedPdfUrl]);

  const handleFilesChange = async (files: FileList | null) => {
    if (!files) return;

    setError(null);
    const newFiles = Array.from(files)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
      }));
    
    const rejectedCount = files.length - newFiles.length;
    if (rejectedCount > 0) {
      setError(`${rejectedCount} file(s) were not valid PDFs and were ignored.`);
    }
    
    if (newFiles.length > 0) {
      setPdfFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleMergePdfs = useCallback(async () => {
    if (pdfFiles.length < 2) {
      setError("Please select at least two PDF files to merge.");
      return;
    }

    setIsMerging(true);
    setError(null);
    setProgressMessage('Initializing...');

    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4', hotfixes: ['px_scaling'] });
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      let isFirstPage = true;

      for (const [fileIndex, pdfFile] of pdfFiles.entries()) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          setProgressMessage(`Processing file ${fileIndex + 1}/${pdfFiles.length}, page ${i}/${pdf.numPages}`);
          
          if (!isFirstPage) {
            doc.addPage();
          }
          
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // High-resolution rendering
          
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const context = canvas.getContext('2d');
          
          if (!context) {
              throw new Error('Could not get canvas context');
          }
          
          await page.render({ canvasContext: context, viewport }).promise;
          const imgData = canvas.toDataURL('image/jpeg', 0.9);

          const aspectRatio = canvas.width / canvas.height;
          let imgWidth = pdfWidth;
          let imgHeight = pdfWidth / aspectRatio;
          if (imgHeight > pdfHeight) {
              imgHeight = pdfHeight;
              imgWidth = pdfHeight * aspectRatio;
          }
          const x = (pdfWidth - imgWidth) / 2;
          const y = (pdfHeight - imgHeight) / 2;

          doc.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
          isFirstPage = false;
        }
      }

      setProgressMessage('Finalizing PDF...');
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
      setDownloadName('lolopdf_merged.pdf');
      incrementConversions(pdfFiles.length);
      setPdfFiles([]);
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during merging. One of the PDFs might be corrupted or password-protected.");
    } finally {
      setIsMerging(false);
      setProgressMessage('');
    }
  }, [pdfFiles, incrementConversions]);

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setPdfFiles([]);
    if(mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
    setMergedPdfUrl(null);
    setDownloadName('');
    setError(null);
    setIsMerging(false);
  };

  const renderContent = () => {
    if (mergedPdfUrl) {
      return <DownloadScreen files={[{url: mergedPdfUrl, name: downloadName}]} onStartOver={reset} autoDownload={true} />;
    }

    if (pdfFiles.length > 0) {
      return (
        <PdfPreviewGrid
          pdfFiles={pdfFiles}
          setPdfFiles={setPdfFiles}
          isProcessing={isMerging}
          onProcess={handleMergePdfs}
          onAddMore={handleAddMoreFiles}
          onClearAll={reset}
          processButtonText="Merge PDFs"
        />
      );
    }

    return <PdfUpload onFilesSelect={handleFilesChange} />;
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Merge PDF Files</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">
                Combine multiple PDFs into a single document. Drag and drop to reorder files before merging.
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
            {isMerging && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Merging PDFs...</p>
                <p className="text-md text-gray-300 mt-2">{progressMessage}</p>
            </div>
            )}
            {renderContent()}
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFilesChange(e.target.files)}
                accept="application/pdf"
                multiple
                className="hidden"
            />
        </div>
    </div>
  );
};
