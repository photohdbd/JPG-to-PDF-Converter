import React, { useState } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const PDFLib: any;

type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface AddPageNumbersPageProps {
  onNavigate: (page: Page) => void;
}

export const AddPageNumbersPage: React.FC<AddPageNumbersPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File; arrayBuffer: ArrayBuffer } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Options
  const [position, setPosition] = useState<Position>('bottom-center');
  const [fontSize, setFontSize] = useState(12);
  const [format, setFormat] = useState('Page {p} of {n}');
  const [margin, setMargin] = useState(36);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    reset();
    const file = files[0];
    if (file.type !== 'application/pdf') return setError("Please select a valid PDF file.");
    const arrayBuffer = await file.arrayBuffer();
    setPdfFile({ file, arrayBuffer });
  };

  const handleProcess = async () => {
    if (!pdfFile) return setError("Please upload a PDF file first.");

    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument, rgb, StandardFonts } = PDFLib;
      const pdfDoc = await PDFDocument.load(pdfFile.arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const numPages = pages.length;

      for (let i = 0; i < numPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageNumText = format.replace('{p}', String(i + 1)).replace('{n}', String(numPages));
        const textWidth = helveticaFont.widthOfTextAtSize(pageNumText, fontSize);
        
        let x = 0;
        let y = 0;

        switch (position) {
          case 'top-left': x = margin; y = height - margin; break;
          case 'top-center': x = width / 2 - textWidth / 2; y = height - margin; break;
          case 'top-right': x = width - margin - textWidth; y = height - margin; break;
          case 'bottom-left': x = margin; y = margin; break;
          case 'bottom-center': x = width / 2 - textWidth / 2; y = margin; break;
          case 'bottom-right': x = width - margin - textWidth; y = margin; break;
        }

        page.drawText(pageNumText, {
          x,
          y,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      setError("Failed to add page numbers. The PDF might be corrupted or protected.");
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
    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
        <h3 className="text-xl font-bold text-center mb-6">Page Number Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Position</label>
                <select value={position} onChange={e => setPosition(e.target.value as Position)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary">
                    <option value="top-left">Top Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Format</label>
                <input
                  type="text"
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                  className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Page {p} of {n}"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Font Size ({fontSize}pt)</label>
                <input
                    type="range" min="8" max="72" step="1" value={fontSize}
                    onChange={e => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-brand-secondary"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Margin ({margin}pt)</label>
                <input
                    type="range" min="10" max="100" step="1" value={margin}
                    onChange={e => setMargin(parseInt(e.target.value))}
                    className="w-full accent-brand-secondary"
                />
            </div>
        </div>
        <button onClick={handleProcess} className="w-full bg-brand-primary text-white font-bold py-3 mt-6 rounded-lg hover:bg-brand-secondary">
          Add Page Numbers
        </button>
    </div>
  );

  return (
    <div className="w-full max-w-4xl flex flex-col">
      <BackButton onClick={() => onNavigate('home')} />
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Add Page Numbers to PDF</h1>
        <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">Easily insert page numbers into your PDF with custom positioning and formatting.</p>
        {error && (
            <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-2xl flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3"><span className="text-xl">×</span></button>
            </div>
        )}
        {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Adding Page Numbers...</p>
            </div>
        )}

        {resultUrl ? (
            <DownloadScreen files={[{url: resultUrl, name: "numbered.pdf"}]} onStartOver={reset} />
        ) : !pdfFile ? (
            <PdfUpload onFilesSelect={handleFileChange} multiple={false} />
        ) : (
             renderOptions()
        )}
      </div>
    </div>
  );
};