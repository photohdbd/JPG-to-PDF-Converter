import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { DocxPreviewGrid } from '../components/DocxPreviewGrid';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';

declare const jspdf: any;
declare const mammoth: any;

export type DocxFile = {
  id: string;
  file: File;
  arrayBuffer: ArrayBuffer;
  status: 'supported' | 'unsupported';
};

export const WordToPdfPage: React.FC = () => {
  const [docxFiles, setDocxFiles] = useState<DocxFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFilesChange = async (files: FileList | null) => {
    if (!files) return;

    setError(null);
    const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const docMimeType = 'application/msword';
    const docxExtension = '.docx';
    const docExtension = '.doc';

    let unsupportedDocCount = 0;

    const newFilesPromises = Array.from(files).map(file => {
      return new Promise<DocxFile | null>((resolve) => {
        const fileNameLower = file.name.toLowerCase();
        const isDocx = file.type === docxMimeType || fileNameLower.endsWith(docxExtension);
        const isDoc = file.type === docMimeType || fileNameLower.endsWith(docExtension);

        if (isDocx || isDoc) {
          if (isDoc) unsupportedDocCount++;
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              id: `${file.name}-${file.lastModified}-${Math.random()}`,
              file,
              arrayBuffer: e.target?.result as ArrayBuffer,
              status: isDocx ? 'supported' : 'unsupported',
            });
          };
          reader.onerror = () => resolve(null);
          reader.readAsArrayBuffer(file);
        } else {
            resolve(null);
        }
      });
    });

    const newAppFiles = (await Promise.all(newFilesPromises)).filter(Boolean) as DocxFile[];
    const rejectedCount = files.length - newAppFiles.length;

    let errorMessage = '';
    if (rejectedCount > 0) {
      errorMessage += `${rejectedCount} file(s) were not valid Word documents and were ignored. `;
    }
    if (unsupportedDocCount > 0) {
        errorMessage += `${unsupportedDocCount} .doc file(s) are not supported for conversion; please re-save them as .docx.`;
    }
    if(errorMessage) setError(errorMessage.trim());
    
    if (newAppFiles.length > 0) {
      setDocxFiles(prev => [...prev, ...newAppFiles]);
    }
  };

  const handleConvertToPdf = useCallback(async () => {
    const filesToConvert = docxFiles.filter(f => f.status === 'supported');
    if (filesToConvert.length === 0) {
      setError("Please select at least one supported .docx file to convert.");
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF();
      
      for (let i = 0; i < filesToConvert.length; i++) {
        const docxFile = filesToConvert[i];
        if (i > 0) {
          doc.addPage();
        }

        const result = await mammoth.extractRawText({ arrayBuffer: docxFile.arrayBuffer });
        const text = result.value;
        
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxLineWidth = pageWidth - margin * 2;

        // Add file name as a title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(docxFile.file.name, margin, margin);

        // Add content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(text, maxLineWidth);
        doc.text(lines, margin, margin + 15);
      }
      
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      setPdfUrl(url);
      setDocxFiles([]);
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred during conversion. The DOCX file might be corrupted or in an unsupported format.");
    } finally {
      setIsConverting(false);
    }
  }, [docxFiles]);

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setDocxFiles([]);
    setPdfUrl(null);
    setError(null);
    setIsConverting(false);
  };

  const renderContent = () => {
    if (pdfUrl) {
      return <DownloadScreen pdfUrl={pdfUrl} onStartOver={reset} fileName="word-to-pdf.pdf" />;
    }

    if (docxFiles.length > 0) {
      return (
        <DocxPreviewGrid
          docxFiles={docxFiles}
          setDocxFiles={setDocxFiles}
          isProcessing={isConverting}
          onProcess={handleConvertToPdf}
          onAddMore={handleAddMoreFiles}
          onClearAll={reset}
          processButtonText="Convert to PDF"
        />
      );
    }

    const acceptTypes = ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return (
        <FileUpload 
            onFilesSelect={handleFilesChange}
            title="Drag & Drop Your Word Files Here"
            accept={acceptTypes}
            description="Supports .docx and .doc (unsupported for conversion)"
        />
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Word to PDF Converter</h1>
        <p className="text-md md:text-lg text-gray-400 mb-8 max-w-2xl text-center">
            Convert Microsoft Word (.docx) documents to PDF. Older .doc files are not supported and will be ignored.
        </p>
        {error && (
          <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-4xl flex items-center shadow-lg">
            <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <span className="text-xl">×</span>
            </button>
          </div>
        )}
        {isConverting && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
            <LoaderIcon className="w-16 h-16 animate-spin text-brand-primary" />
            <p className="text-xl text-white mt-4">Converting to PDF...</p>
          </div>
        )}
        {renderContent()}
        <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFilesChange(e.target.files)}
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            className="hidden"
        />
    </div>
  );
};
