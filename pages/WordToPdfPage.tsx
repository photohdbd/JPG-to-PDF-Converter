import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { DocxPreviewGrid } from '../components/DocxPreviewGrid';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const jspdf: any;
declare const mammoth: any;

export type DocxFile = {
  id: string;
  file: File;
  arrayBuffer: ArrayBuffer;
  status: 'supported' | 'unsupported';
};

interface WordToPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const WordToPdfPage: React.FC<WordToPdfPageProps> = ({ onNavigate }) => {
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
        errorMessage += `${unsupportedDocCount} .doc file(s) are not supported for conversion; please re-save them as .docx from your word processor.`;
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
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      let combinedHtml = '';

      for (const [index, docxFile] of filesToConvert.entries()) {
        const result = await mammoth.convertToHtml({ arrayBuffer: docxFile.arrayBuffer });
        // Add a wrapper div to contain the content of one document
        combinedHtml += `<div class="document-container"><h1>Document: ${docxFile.file.name}</h1>${result.value}</div>`;
        // Add a page break for the next document
        if (index < filesToConvert.length - 1) {
            combinedHtml += '<div class="page-break"></div>';
        }
      }

      const styledHtml = `
        <html>
          <head>
            <style>
              body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
              .page-break { page-break-before: always; }
              .document-container { margin: 20px; }
              h1, h2, h3, h4, h5, h6 { font-family: 'Arial', sans-serif; color: #000; margin-top: 1.2em; margin-bottom: 0.5em; line-height: 1.2; }
              h1 { font-size: 20pt; font-weight: bold; }
              h2 { font-size: 18pt; font-weight: bold; }
              h3 { font-size: 16pt; font-weight: bold; }
              p, ul, ol, table { margin-bottom: 1em; }
              ul, ol { padding-left: 40px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top; }
              th { background-color: #f2f2f2; font-weight: bold; }
              strong, b { font-weight: bold; }
              em, i { font-style: italic; }
            </style>
          </head>
          <body>${combinedHtml}</body>
        </html>
      `;

      await pdf.html(styledHtml, {
        callback: function (doc) {
          const pdfBlob = doc.output('blob');
          const url = URL.createObjectURL(pdfBlob);
          setPdfUrl(url);
          setDocxFiles([]);
        },
        margin: [60, 60, 60, 60],
        autoPaging: 'text',
        width: 475, // A4 width in points (595) - margins (120)
        windowWidth: 1200, // Larger window to help with layout calculations
      });
      
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
      return <DownloadScreen files={[{url: pdfUrl, name: "word-to-pdf.pdf"}]} onStartOver={reset} autoDownload={true} />;
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
            description="Supports .docx for conversion. Older .doc files cannot be converted."
        />
    );
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Word to PDF Converter</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl text-center">
                Convert Microsoft Word (.docx) documents to high-quality PDF files that preserve formatting.
            </p>
            {error && (
            <div className="bg-yellow-300/50 dark:bg-yellow-900/50 border border-yellow-500 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-4xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <span className="text-xl">×</span>
                </button>
            </div>
            )}
            {isConverting && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
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
    </div>
  );
};