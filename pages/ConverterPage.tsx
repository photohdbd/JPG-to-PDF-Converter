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
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
           resolve({ ...baseFile, type: 'text' });
        } else {
          resolve({ ...baseFile, type: 'unsupported' });
        }
      });
    });

    const newAppFiles = await Promise.all(newFilesPromises);
    
    if (newAppFiles.length > 0) {
      setAppFiles(prev => [...prev, ...newAppFiles]);
    }
  };

    const addImageToPdf = (doc: any, file: File, pdfWidth: number, pdfHeight: number): Promise<void> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (!event.target?.result) return reject(new Error('Failed to read image file.'));
                const img = new Image();
                img.onload = () => {
                    const aspectRatio = img.width / img.height;
                    let imgWidth = pdfWidth;
                    let imgHeight = pdfWidth / aspectRatio;
                    if (imgHeight > pdfHeight) {
                        imgHeight = pdfHeight;
                        imgWidth = pdfHeight * aspectRatio;
                    }
                    const x = (pdfWidth - imgWidth) / 2;
                    const y = (pdfHeight - imgHeight) / 2;
                    doc.addImage(img.src, file.type.split('/')[1].toUpperCase(), x, y, imgWidth, imgHeight);
                    resolve();
                };
                img.onerror = reject;
                img.src = event.target.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const addTextToPdf = async (doc: any, file: File, pdfWidth: number, pdfHeight: number): Promise<void> => {
        const text = await file.text();
        const margin = 40;
        const usableWidth = pdfWidth - 2 * margin;
        const lines = doc.splitTextToSize(text, usableWidth);
        let y = margin;
        doc.setFontSize(12);
        
        lines.forEach((line: string) => {
            if (y > pdfHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += doc.getLineHeight();
        });
    };

  const handleConvertToPdf = useCallback(async () => {
    const filesToConvert = appFiles;
    if (filesToConvert.length === 0) return setError("Please select at least one file.");
    
    const unsupportedFiles = filesToConvert.filter(f => f.type === 'unsupported');
    if (unsupportedFiles.length > 0) {
        return setError(`Cannot convert ${unsupportedFiles.map(f => f.file.name).join(', ')}. Only images and text files are supported for in-browser conversion.`);
    }

    setIsConverting(true);
    setError(null);
    setProgressMessage('Initializing PDF...');

    try {
        const { jsPDF } = jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4', hotfixes: ['px_scaling'] });
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        for (let i = 0; i < filesToConvert.length; i++) {
            const appFile = filesToConvert[i];
            setProgressMessage(`Processing file ${i + 1} of ${filesToConvert.length}: ${appFile.file.name}`);
            
            if (i > 0) doc.addPage();

            if (appFile.type === 'image') {
                await addImageToPdf(doc, appFile.file, pdfWidth, pdfHeight);
            } else if (appFile.type === 'text') {
                await addTextToPdf(doc, appFile.file, pdfWidth, pdfHeight);
            }
        }

        setProgressMessage('Finalizing PDF...');
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setDownloadName('lolopdf_converted.pdf');
        setAppFiles([]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during PDF conversion.");
    } finally {
      setIsConverting(false);
      setProgressMessage('');
    }
  }, [appFiles]);


  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setAppFiles([]);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setDownloadName('');
    setError(null);
    setIsConverting(false);
    setProgressMessage('');
  };

  const renderContent = () => {
    if (pdfUrl) {
      return <DownloadScreen files={[{ url: pdfUrl, name: downloadName }]} onStartOver={reset} autoDownload={true} />;
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
                <p className="text-md text-gray-300 mt-2">{progressMessage}</p>
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
