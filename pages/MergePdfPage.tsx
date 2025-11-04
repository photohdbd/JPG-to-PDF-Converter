import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { PdfPreviewGrid } from '../components/PdfPreviewGrid';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const PDFLib: any;

export type PdfFile = {
  id: string;
  file: File;
  arrayBuffer: ArrayBuffer;
};

interface MergePdfPageProps {
  onNavigate: (page: Page) => void;
}

export const MergePdfPage: React.FC<MergePdfPageProps> = ({ onNavigate }) => {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
      }
    };
  }, [mergedPdfUrl]);

  const handleFilesChange = async (files: FileList | null) => {
    if (!files) return;

    setError(null);
    const newFilesPromises = Array.from(files).map(file => {
      return new Promise<PdfFile | null>((resolve) => {
        if (file.type !== 'application/pdf') {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file,
            arrayBuffer: e.target?.result as ArrayBuffer,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsArrayBuffer(file);
      });
    });

    const newAppFiles = (await Promise.all(newFilesPromises)).filter(Boolean) as PdfFile[];
    const rejectedCount = files.length - newAppFiles.length;

    if (rejectedCount > 0) {
      setError(`${rejectedCount} file(s) were not valid PDFs and were ignored.`);
    }
    
    if (newAppFiles.length > 0) {
      setPdfFiles(prev => [...prev, ...newAppFiles]);
    }
  };

  const handleMergePdfs = useCallback(async () => {
    if (pdfFiles.length < 2) {
      setError("Please select at least two PDF files to merge.");
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      const { PDFDocument } = PDFLib;
      const mergedPdf = await PDFDocument.create();
      
      for (const pdfFile of pdfFiles) {
        const pdf = await PDFDocument.load(pdfFile.arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      const pdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      
      setMergedPdfUrl(url);
      setPdfFiles([]);
      
    } catch (err)
 {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during merging.");
    } finally {
      setIsMerging(false);
    }
  }, [pdfFiles]);

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setPdfFiles([]);
    setMergedPdfUrl(null);
    setError(null);
    setIsMerging(false);
  };

  const renderContent = () => {
    if (mergedPdfUrl) {
      return <DownloadScreen files={[{url: mergedPdfUrl, name: "merged.pdf"}]} onStartOver={reset} autoDownload={true} />;
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