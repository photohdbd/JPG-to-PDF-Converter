import React, { useState, useEffect, useRef } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const PDFLib: any;
declare const pdfjsLib: any;
declare const SignaturePad: any;

interface SignPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const SignPdfPage: React.FC<SignPdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File; arrayBuffer: ArrayBuffer } | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedText, setTypedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signaturePadRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);
  
   useEffect(() => {
    if (signatureMode === 'draw' && canvasRef.current) {
      signaturePadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(240, 240, 240)'
      });
      const resizeCanvas = () => {
         if (canvasRef.current) {
            const ratio =  Math.max(window.devicePixelRatio || 1, 1);
            canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
            canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
            canvasRef.current.getContext("2d")?.scale(ratio, ratio);
            signaturePadRef.current.clear();
         }
      };
      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, [signatureMode]);


  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    reset();
    const file = files[0];
    if (file.type !== 'application/pdf') {
      setError("Please select a valid PDF file.");
      return;
    }
    setIsProcessing(true);
    const arrayBuffer = await file.arrayBuffer();
    setPdfFile({ file, arrayBuffer });
    
    try {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const pageUrls: string[] = [];
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const context = canvas.getContext('2d');
            if (context) {
                await page.render({ canvasContext: context, viewport }).promise;
                pageUrls.push(canvas.toDataURL());
            }
        }
        setPages(pageUrls);
    } catch(e) {
        setError("Could not read PDF. It may be corrupt or password protected.");
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleSignatureCreation = () => {
    if (signatureMode === 'draw' && signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      setSignature(signaturePadRef.current.toDataURL('image/png'));
    } else if (signatureMode === 'type' && typedText) {
        // Create image from text
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(0,0, canvas.width, canvas.height);
            ctx.font = '50px "Homemade Apple", cursive';
            ctx.fillStyle = "#000";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(typedText, canvas.width/2, canvas.height/2);
            setSignature(canvas.toDataURL('image/png'));
        }
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              setSignature(event.target?.result as string);
          }
          reader.readAsDataURL(e.target.files[0]);
      }
  }

  const handleApplySignature = async (e: React.MouseEvent<HTMLDivElement>) => {
      if (!pdfFile || !signature) return;
      
      const target = e.target as HTMLElement;
      const pageElement = target.closest('.pdf-page') as HTMLImageElement;
      if (!pageElement) return;

      setIsProcessing(true);

      const pageNum = parseInt(pageElement.dataset.pageNumber || '0', 10);
      const rect = pageElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      try {
          const { PDFDocument, png } = PDFLib;
          const pdfDoc = await PDFDocument.load(pdfFile.arrayBuffer);
          const signatureImage = await pdfDoc.embedPng(signature);
          const pages = pdfDoc.getPages();
          const targetPage = pages[pageNum - 1];

          const scale = targetPage.getWidth() / rect.width;
          const sigWidth = 100 * scale; 
          const sigHeight = (sigWidth * signatureImage.height) / signatureImage.width;

          targetPage.drawImage(signatureImage, {
              x: x * scale - (sigWidth/2),
              y: targetPage.getHeight() - (y * scale) - (sigHeight/2),
              width: sigWidth,
              height: sigHeight,
          });

          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          setResultUrl(URL.createObjectURL(blob));
      } catch (err) {
          setError("Failed to apply signature.");
      } finally {
          setIsProcessing(false);
      }
  }

  const reset = () => {
    setPdfFile(null);
    setPages([]);
    setSignature(null);
    setTypedText('');
    setSignatureMode('draw');
    setIsProcessing(false);
    setResultUrl(null);
    setError(null);
  };
  
   const renderSignatureCreator = () => (
      <div className="w-full max-w-2xl bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-center border-b border-gray-700 mb-4">
              <button onClick={() => setSignatureMode('draw')} className={`px-4 py-2 ${signatureMode === 'draw' ? 'border-b-2 border-brand-primary text-white' : 'text-gray-400'}`}>Draw</button>
              <button onClick={() => setSignatureMode('type')} className={`px-4 py-2 ${signatureMode === 'type' ? 'border-b-2 border-brand-primary text-white' : 'text-gray-400'}`}>Type</button>
              <button onClick={() => setSignatureMode('upload')} className={`px-4 py-2 ${signatureMode === 'upload' ? 'border-b-2 border-brand-primary text-white' : 'text-gray-400'}`}>Upload</button>
          </div>
          {signatureMode === 'draw' && (
              <div className="bg-gray-200 rounded">
                  <canvas ref={canvasRef} className="w-full h-48"></canvas>
                  <button onClick={() => signaturePadRef.current?.clear()} className="w-full text-center py-1 text-sm text-gray-600 hover:text-black">Clear</button>
              </div>
          )}
          {signatureMode === 'type' && (
              <input 
                type="text" 
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-full p-4 text-3xl bg-gray-700 text-white rounded text-center"
                style={{fontFamily: '"Homemade Apple", cursive'}}
                placeholder="Type your name"
              />
          )}
          {signatureMode === 'upload' && (
              <input type="file" accept="image/png" onChange={handleImageUpload} className="w-full p-4 bg-gray-700 text-white rounded"/>
          )}
          {signatureMode !== 'upload' && <button onClick={handleSignatureCreation} className="w-full mt-4 bg-brand-primary text-white py-2 rounded">Create Signature</button>}
      </div>
  );

  return (
    <div className="w-full max-w-6xl flex flex-col">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Homemade+Apple&display=swap');`}</style>
      <BackButton onClick={() => onNavigate('home')} />
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Sign PDF</h1>
        <p className="text-md md:text-lg text-gray-400 mb-8 max-w-xl text-center">
            Create your signature and place it anywhere on your document.
        </p>
         {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-4xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3"><span className="text-xl">×</span></button>
            </div>
        )}
        {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon className="w-16 h-16 animate-spin text-brand-primary" />
                <p className="text-xl text-white mt-4">Processing...</p>
            </div>
        )}

        {resultUrl ? (
            <DownloadScreen pdfUrl={resultUrl} onStartOver={reset} fileName="signed.pdf" />
        ) : !pdfFile ? (
            <PdfUpload onFilesSelect={handleFileChange} multiple={false} />
        ) : !signature ? (
             renderSignatureCreator()
        ) : (
          <div className="w-full flex flex-col items-center">
              <h2 className="text-xl font-bold mb-2">Click on the document to place your signature</h2>
              <p className="text-gray-400 mb-4">Your signature:</p>
              <img src={signature} alt="Your signature" className="h-20 bg-white p-2 rounded border mb-4"/>
              <div className="w-full max-w-4xl border-4 border-gray-700 rounded-lg overflow-y-auto max-h-[70vh] p-4 bg-gray-900">
                  {pages.map((dataUrl, index) => (
                      <div key={index} className="relative mb-4 cursor-pointer" onClick={handleApplySignature}>
                          <img 
                              src={dataUrl} 
                              alt={`Page ${index + 1}`} 
                              data-page-number={index + 1}
                              className="w-full h-auto pdf-page"
                          />
                      </div>
                  ))}
              </div>
               <button onClick={reset} className="mt-4 px-6 py-2 bg-red-800 text-white font-semibold rounded-md hover:bg-red-700">Start Over</button>
          </div>
        )}
      </div>
    </div>
  );
};
