import React, { useState, useEffect } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const pdfjsLib: any;
declare const jspdf: any;

interface WatermarkPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const WatermarkPdfPage: React.FC<WatermarkPdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [image, setImage] = useState<{ file: File; url: string, element: HTMLImageElement } | null>(null);
  
  const [opacity, setOpacity] = useState(0.2);
  const [rotation, setRotation] = useState(-45);
  const [fontSize, setFontSize] = useState(72);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');

  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);

  const handleFileChange = async (files: FileList | null, type: 'pdf' | 'image') => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (type === 'pdf') {
      if (file.type !== 'application/pdf') return setError("Please upload a valid PDF file.");
      reset();
      setIsProcessing(true);
      setProgressMessage("Rendering preview...");
      try {
        const arrayBuffer = await file.arrayBuffer();
        setPdfFile({ file });
        
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext('2d');
        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          setPreviewUrl(canvas.toDataURL());
        }
      } catch (err) {
        setError("Could not read PDF. It might be corrupted or password-protected.");
      } finally {
        setIsProcessing(false);
        setProgressMessage("");
      }
    } else { // image
      if (!file.type.startsWith('image/')) return setError("Please upload a valid image file (PNG, JPG).");
      const url = URL.createObjectURL(file);
      const imgElement = new Image();
      imgElement.onload = () => {
        setImage({ file, url, element: imgElement });
      }
      imgElement.src = url;
    }
  };

  const handleProcess = async () => {
    if (!pdfFile) return setError("Please upload a PDF file first.");
    if (mode === 'text' && !text) return setError("Please enter watermark text.");
    if (mode === 'image' && !image) return setError("Please upload a watermark image.");

    setIsProcessing(true);
    setError(null);
    setProgressMessage("Applying watermark...");

    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4', hotfixes: ['px_scaling'] });
      
      const arrayBuffer = await pdfFile.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

      for(let i=1; i<=pdf.numPages; i++) {
        setProgressMessage(`Processing page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas context not available');
        
        // Draw PDF page
        await page.render({ canvasContext: context, viewport }).promise;
        
        // Apply watermark
        context.globalAlpha = opacity;
        context.save();
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(rotation * Math.PI / 180);
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        if (mode === 'text') {
          context.font = `${fontSize}px Arial`;
          context.fillStyle = '#000000';
          context.fillText(text, 0, 0);
        } else if (image) {
          const imgWidth = canvas.width / 2;
          const imgHeight = (image.element.height / image.element.width) * imgWidth;
          context.drawImage(image.element, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        }
        context.restore();

        // Add to new PDF
        if (i > 1) doc.addPage([canvas.width, canvas.height]);
        else {
          const page1 = doc.internal.pages[1];
          page1.width = canvas.width;
          page1.height = canvas.height;
        }
        doc.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, canvas.width, canvas.height);
      }

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setDownloadName(pdfFile.file.name.replace(/\.pdf$/i, '_watermarked.pdf'));

    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to add watermark. The PDF might be corrupted or protected.");
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  };

  const reset = () => {
    setPdfFile(null);
    if(resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setDownloadName('');
    if(previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if(image?.url) URL.revokeObjectURL(image.url);
    setImage(null);
    setError(null);
  };
  
  const renderWorkspace = () => (
    <div className="w-full flex flex-col md:flex-row gap-8">
      {/* Controls */}
      <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg h-fit">
          <p className="text-lg font-bold mb-4">Watermark Settings</p>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg mb-4 overflow-hidden">
              <button onClick={() => setMode('text')} className={`w-1/2 py-2 text-sm font-semibold transition-colors ${mode === 'text' ? 'bg-brand-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Text</button>
              <button onClick={() => setMode('image')} className={`w-1/2 py-2 text-sm font-semibold transition-colors ${mode === 'image' ? 'bg-brand-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Image</button>
          </div>

          {mode === 'text' ? (
              <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Watermark Text"/>
          ) : (
              <input type="file" accept="image/png, image/jpeg" onChange={e => handleFileChange(e.target.files, 'image')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"/>
          )}

          <div className="space-y-4">
              <div>
                  <label className="text-sm">Opacity ({Math.round(opacity * 100)}%)</label>
                  <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="w-full accent-brand-secondary" />
              </div>
              <div>
                  <label className="text-sm">Rotation ({rotation}°)</label>
                  <input type="range" min="-180" max="180" step="5" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className="w-full accent-brand-secondary" />
              </div>
              {mode === 'text' && <div>
                  <label className="text-sm">Font Size ({fontSize}pt)</label>
                  <input type="range" min="8" max="144" step="2" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full accent-brand-secondary" />
              </div>}
          </div>
          <button onClick={handleProcess} className="w-full bg-brand-primary text-white font-bold py-3 mt-6 rounded-lg hover:bg-brand-secondary">Add Watermark & Download</button>
      </div>
      
      {/* Preview */}
      <div className="w-full md:w-2/3 bg-gray-200 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-300 dark:border-gray-700 flex justify-center items-center">
        <div className="relative overflow-hidden shadow-lg">
          <img src={previewUrl!} alt="PDF Preview" className="max-w-full max-h-full" />
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            {mode === 'text' ? (
              <p 
                className="font-bold text-gray-800/80 break-all"
                style={{
                  fontSize: `${fontSize / 2}px`, // Approximate scaling for preview
                  opacity,
                  transform: `rotate(${rotation}deg)`
                }}
              >{text}</p>
            ) : image ? (
              <img 
                src={image.url}
                alt="Watermark preview"
                className="w-1/2"
                style={{
                  opacity,
                  transform: `rotate(${rotation}deg)`
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl flex flex-col">
      <BackButton onClick={() => onNavigate('home')} />
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Add Watermark</h1>
        <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">Apply a text or image watermark to your PDF documents with a live preview.</p>
        {error && (
            <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-4xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3"><span className="text-xl">×</span></button>
            </div>
        )}
        {isProcessing && !resultUrl && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">{progressMessage}</p>
            </div>
        )}

        {resultUrl ? (
            <DownloadScreen files={[{url: resultUrl, name: downloadName}]} onStartOver={reset} />
        ) : !pdfFile ? (
            <PdfUpload onFilesSelect={(f) => handleFileChange(f, 'pdf')} multiple={false} />
        ) : (
             renderWorkspace()
        )}
      </div>
    </div>
  );
};