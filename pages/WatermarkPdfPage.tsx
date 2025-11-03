import React, { useState } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const PDFLib: any;

interface WatermarkPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const WatermarkPdfPage: React.FC<WatermarkPdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File; arrayBuffer: ArrayBuffer } | null>(null);
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [image, setImage] = useState<ArrayBuffer | null>(null);
  const [opacity, setOpacity] = useState(0.2);
  const [rotation, setRotation] = useState(-45);
  const [fontSize, setFontSize] = useState(72);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (files: FileList | null, type: 'pdf' | 'image') => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (type === 'pdf') {
      if (file.type !== 'application/pdf') return setError("Please upload a valid PDF file.");
      reset();
      const arrayBuffer = await file.arrayBuffer();
      setPdfFile({ file, arrayBuffer });
    } else {
      if (!file.type.startsWith('image/')) return setError("Please upload a valid image file.");
      const arrayBuffer = await file.arrayBuffer();
      setImage(arrayBuffer);
    }
  };

  const handleProcess = async () => {
    if (!pdfFile) return setError("Please upload a PDF file first.");
    if (mode === 'text' && !text) return setError("Please enter watermark text.");
    if (mode === 'image' && !image) return setError("Please upload a watermark image.");

    setIsProcessing(true);
    setError(null);

    try {
      const { PDFDocument, rgb, degrees } = PDFLib;
      const pdfDoc = await PDFDocument.load(pdfFile.arrayBuffer);
      const pages = pdfDoc.getPages();
      
      let watermark;
      if (mode === 'image' && image) {
        watermark = await pdfDoc.embedPng(image);
      }
      
      for (const page of pages) {
        const { width, height } = page.getSize();
        if (mode === 'text') {
            page.drawText(text, {
                x: width / 2,
                y: height / 2,
                size: fontSize,
                color: rgb(0.5, 0.5, 0.5),
                opacity: opacity,
                rotate: degrees(rotation),
                // Font would ideally be embedded, but using standard for simplicity
            });
        } else if (watermark) {
            const imgDims = watermark.scale(0.5);
            page.drawImage(watermark, {
                x: width / 2 - imgDims.width / 2,
                y: height / 2 - imgDims.height / 2,
                width: imgDims.width,
                height: imgDims.height,
                opacity: opacity,
                rotate: degrees(rotation),
            });
        }
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError("Failed to add watermark. The PDF might be corrupted or protected.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPdfFile(null);
    setResultUrl(null);
    setError(null);
  };
  
  const renderOptions = () => (
    <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg border border-gray-700">
        <p className="text-lg font-bold mb-4">Watermark Settings</p>
        <div className="flex border border-gray-600 rounded-lg mb-4">
            <button onClick={() => setMode('text')} className={`w-1/2 py-2 ${mode === 'text' ? 'bg-brand-primary' : ''}`}>Text</button>
            <button onClick={() => setMode('image')} className={`w-1/2 py-2 ${mode === 'image' ? 'bg-brand-primary' : ''}`}>Image</button>
        </div>

        {mode === 'text' ? (
            <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full p-2 bg-gray-700 rounded mb-4" placeholder="Watermark Text"/>
        ) : (
            <input type="file" accept="image/png, image/jpeg" onChange={e => handleFileChange(e.target.files, 'image')} className="w-full p-2 bg-gray-700 rounded mb-4"/>
        )}

        <div className="grid grid-cols-2 gap-4">
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
        <button onClick={handleProcess} className="w-full bg-brand-primary text-white font-bold py-3 mt-6 rounded-lg hover:bg-brand-secondary">Add Watermark</button>
    </div>
  );

  return (
    <div className="w-full max-w-4xl flex flex-col">
      <BackButton onClick={() => onNavigate('home')} />
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Add Watermark</h1>
        <p className="text-md md:text-lg text-gray-400 mb-8 max-w-xl text-center">Apply a text or image watermark to your PDF documents.</p>
        {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-lg flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3"><span className="text-xl">×</span></button>
            </div>
        )}
        {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon className="w-16 h-16 animate-spin text-brand-primary" />
                <p className="text-xl text-white mt-4">Adding Watermark...</p>
            </div>
        )}

        {resultUrl ? (
            <DownloadScreen pdfUrl={resultUrl} onStartOver={reset} fileName="watermarked.pdf" />
        ) : !pdfFile ? (
            <PdfUpload onFilesSelect={(f) => handleFileChange(f, 'pdf')} multiple={false} />
        ) : (
             renderOptions()
        )}
      </div>
    </div>
  );
};
