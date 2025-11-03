import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const pptx: any;
declare const jspdf: any;

interface PowerpointToPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const PowerpointToPdfPage: React.FC<PowerpointToPdfPageProps> = ({ onNavigate }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    reset();
    const file = files[0];
    
    if (files.length > 1) {
        setError("Please select only one file. The first file has been chosen.");
    }
    
    const validExtensions = ['.pptx'];
    const validMimeTypes = ['application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

    if (!validMimeTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError("Invalid file type. Please upload a .pptx file.");
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
        const { jsPDF } = jspdf;
        const result = await new pptx.Presentation().loadFile(file);
        const numSlides = result.slides.length;
        let doc: any = null;

        for (let i = 0; i < numSlides; i++) {
            setProgress(`Processing slide ${i + 1} of ${numSlides}...`);
            const slide = result.slides[i];
            const dataUrl = await slide.render("image");

            const img = new Image();
            img.src = dataUrl;

            await new Promise<void>((resolve) => {
                img.onload = () => {
                    const orientation = img.width > img.height ? 'l' : 'p';
                    if (!doc) {
                        doc = new jsPDF(orientation, 'px', [img.width, img.height]);
                    } else {
                        doc.addPage([img.width, img.height], orientation);
                    }
                    doc.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
                    resolve();
                }
            });
        }
        
        if(doc) {
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
        } else {
             throw new Error("Could not create PDF document from presentation.");
        }

    } catch (err) {
        console.error(err);
        setError("Failed to convert presentation. The file may be corrupt or in an unsupported format.");
    } finally {
        setIsConverting(false);
        setProgress('');
    }
  };
  
  const reset = () => {
    setIsConverting(false);
    setPdfUrl(null);
    setError(null);
    setProgress('');
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">PowerPoint to PDF Converter</h1>
            <p className="text-md md:text-lg text-gray-400 mb-8 max-w-2xl text-center">
                Convert your PowerPoint (.pptx) presentations into PDF documents seamlessly.
            </p>
            {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-4xl flex items-center shadow-lg">
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
                <p className="text-xl text-white mt-4">Converting Presentation...</p>
                <p className="text-md text-gray-300 mt-2">{progress}</p>
            </div>
            )}

            {pdfUrl ? (
                <DownloadScreen pdfUrl={pdfUrl} onStartOver={reset} fileName="presentation.pdf" />
            ) : (
                <FileUpload 
                    onFilesSelect={handleFileChange}
                    title="Drag & Drop Your PowerPoint File Here"
                    accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    description="Supports .pptx files"
                />
            )}
        </div>
    </div>
  );
};
