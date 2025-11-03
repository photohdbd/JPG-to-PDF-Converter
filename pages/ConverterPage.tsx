import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { ImagePreviewGrid } from '../components/ImagePreviewGrid';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const jspdf: any;

export type AppFile = {
  id: string;
  file: File;
  type: 'image' | 'text' | 'unsupported';
  previewUrl?: string; // For images
  textContent?: string; // For text files
};

interface ConverterPageProps {
  onNavigate: (page: Page) => void;
}

const TEXT_MIME_TYPES = [
    'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/css',
    'application/javascript', 'application/json', 'application/xml', 'application/rtf'
];
const TEXT_EXTENSIONS = [
    '.txt', '.md', '.csv', '.html', '.htm', '.css', '.js', '.json', '.xml', '.log', '.rtf',
    '.c', '.cpp', '.java', '.py', '.php', '.rb', '.sh', '.tex', '.wps'
];

const getFileType = (file: File): 'image' | 'text' | 'unsupported' => {
    if (file.type.startsWith('image/')) {
        return 'image';
    }
    if (TEXT_MIME_TYPES.includes(file.type)) {
        return 'text';
    }
    const fileName = file.name.toLowerCase();
    for (const ext of TEXT_EXTENSIONS) {
        if (fileName.endsWith(ext)) {
            return 'text';
        }
    }
    return 'unsupported';
};


export const ConverterPage: React.FC<ConverterPageProps> = ({ onNavigate }) => {
  const [appFiles, setAppFiles] = useState<AppFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Cleanup object URLs to prevent memory leaks
    return () => {
      appFiles.forEach(appFile => {
        if (appFile.previewUrl) {
          URL.revokeObjectURL(appFile.previewUrl);
        }
      });
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [appFiles, pdfUrl]);

  const handleFilesChange = async (files: FileList | null) => {
    if (!files) return;

    setError(null);
    const newFilesPromises = Array.from(files).map(file => {
      return new Promise<AppFile>((resolve) => {
        const fileType = getFileType(file);
        const baseFile = {
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
        };

        if (fileType === 'image') {
          resolve({ ...baseFile, type: 'image', previewUrl: URL.createObjectURL(file) });
        } else if (fileType === 'text') {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({ ...baseFile, type: 'text', textContent: e.target?.result as string });
          };
          reader.onerror = () => {
            // If reading fails, treat as unsupported
            resolve({ ...baseFile, type: 'unsupported' });
          };
          reader.readAsText(file);
        } else {
          resolve({ ...baseFile, type: 'unsupported' });
        }
      });
    });

    const newAppFiles = await Promise.all(newFilesPromises);
    const unsupportedCount = newAppFiles.filter(f => f.type === 'unsupported').length;

    if (unsupportedCount > 0) {
      setError(`${unsupportedCount} file(s) are of an unsupported type. They will be shown but not included in the PDF.`);
    }
    
    if (newAppFiles.length > 0) {
      setAppFiles(prev => [...prev, ...newAppFiles]);
    }
  };

  const handleConvertToPdf = useCallback(async () => {
    const filesToConvert = appFiles.filter(f => f.type !== 'unsupported');
    if (filesToConvert.length === 0) {
      setError("Please select at least one supported file (image or text).");
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF();
      
      for (let i = 0; i < filesToConvert.length; i++) {
        const appFile = filesToConvert[i];
        if (i > 0) {
          doc.addPage();
        }

        if (appFile.type === 'image' && appFile.previewUrl) {
            const img = new Image();
            img.src = appFile.previewUrl;
            
            await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Failed to get canvas context.'));
                    
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    const ratio = Math.min(pageWidth / img.naturalWidth, pageHeight / img.naturalHeight);
                    const newWidth = img.naturalWidth * ratio;
                    const newHeight = img.naturalHeight * ratio;
                    const x = (pageWidth - newWidth) / 2;
                    const y = (pageHeight - newHeight) / 2;

                    doc.addImage(dataUrl, 'JPEG', x, y, newWidth, newHeight, undefined, 'FAST');
                    resolve();
                };
                img.onerror = (err) => reject(new Error(`Failed to load image: ${appFile.file.name}`));
            });
        } else if (appFile.type === 'text' && appFile.textContent) {
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const maxLineWidth = pageWidth - margin * 2;
            
            doc.setFont('courier', 'normal');
            doc.setFontSize(10);

            const lines = doc.splitTextToSize(appFile.textContent, maxLineWidth);
            doc.text(lines, margin, margin);
        }
      }

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setAppFiles([]); // Clear files after successful conversion

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during PDF conversion.");
    } finally {
      setIsConverting(false);
    }
  }, [appFiles]);

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setAppFiles([]);
    setPdfUrl(null);
    setError(null);
    setIsConverting(false);
  };

  const renderContent = () => {
    if (pdfUrl) {
      return <DownloadScreen files={[{ url: pdfUrl, name: 'converted-files.pdf' }]} onStartOver={reset} />;
    }

    if (appFiles.length > 0) {
      return (
        <ImagePreviewGrid
          appFiles={appFiles}
          setAppFiles={setAppFiles}
          isConverting={isConverting}
          onConvertToPdf={handleConvertToPdf}
          onAddMore={handleAddMoreFiles}
          onClearAll={reset}
        />
      );
    }

    return <FileUpload onFilesSelect={handleFilesChange} />;
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            {error && (
            <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-2xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
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
                accept="image/*,.txt,.md,.csv,.json,.xml,.html,.css,.js,.log,.rtf,.c,.cpp,.java,.py,.php,.rb,.sh,.tex"
                multiple
                className="hidden"
            />
        </div>
    </div>
  );
};