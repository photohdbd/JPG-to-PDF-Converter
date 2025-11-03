import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ImagePreviewGrid } from './components/ImagePreviewGrid';
import { DownloadScreen } from './components/DownloadScreen';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoaderIcon, AlertTriangleIcon } from './components/Icons';

declare const jspdf: any;

export type ImageFile = {
  id: string;
  file: File;
  previewUrl: string;
};

const App: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Cleanup object URLs to prevent memory leaks
    return () => {
      imageFiles.forEach(imageFile => URL.revokeObjectURL(imageFile.previewUrl));
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [imageFiles, pdfUrl]);

  const handleFilesChange = (files: FileList | null) => {
    if (!files) return;

    setError(null);
    const newImageFiles: ImageFile[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    if (newImageFiles.length !== files.length) {
        setError("Some files were not valid images and were ignored.");
    }
    
    if (newImageFiles.length > 0) {
        setImageFiles(prev => [...prev, ...newImageFiles]);
    }
  };

  const handleConvertToPdf = useCallback(async () => {
    if (imageFiles.length === 0) {
      setError("Please select at least one image file.");
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF();
      
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        if (i > 0) {
          doc.addPage();
        }

        const img = new Image();
        img.src = imageFile.previewUrl;
        
        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Failed to get canvas context.'));
                }
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const imgWidth = img.naturalWidth;
                const imgHeight = img.naturalHeight;

                const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

                const newWidth = imgWidth * ratio;
                const newHeight = imgHeight * ratio;

                const x = (pageWidth - newWidth) / 2;
                const y = (pageHeight - newHeight) / 2;

                doc.addImage(dataUrl, 'JPEG', x, y, newWidth, newHeight, undefined, 'FAST');
                resolve();
            };
            img.onerror = (err) => {
                console.error("Image load error:", err);
                reject(new Error(`Failed to load image: ${imageFile.file.name}`));
            };
        });
      }

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setImageFiles([]); // Clear images after successful conversion

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during PDF conversion.");
    } finally {
      setIsConverting(false);
    }
  }, [imageFiles]);

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setImageFiles([]);
    setPdfUrl(null);
    setError(null);
    setIsConverting(false);
  };

  const renderContent = () => {
    if (pdfUrl) {
      return <DownloadScreen pdfUrl={pdfUrl} onStartOver={reset} />;
    }

    if (imageFiles.length > 0) {
      return (
        <ImagePreviewGrid
          imageFiles={imageFiles}
          setImageFiles={setImageFiles}
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
    <div className="flex flex-col min-h-screen bg-gray-900 font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center">
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-2xl flex items-center shadow-lg">
            <AlertTriangleIcon className="w-5 h-5 mr-3" />
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
      </main>
      <Footer />
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFilesChange(e.target.files)}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
};

export default App;