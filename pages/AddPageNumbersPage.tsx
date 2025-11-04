import React, { useState } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const pdfjsLib: any;
declare const jspdf: any;

type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface AddPageNumbersPageProps {
  onNavigate: (page: Page) => void;
}

export const AddPageNumbersPage: React.FC<AddPageNumbersPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Options
  const [position, setPosition] = useState<Position>('bottom-center');
  const [fontSize, setFontSize] = useState(12);
  const [format, setFormat] = useState('{p}/{n}');
  const [margin, setMargin] = useState(36);

  useState(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  });

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    reset();
    const file = files[0];
    if (file.type !== 'application/pdf') return setError("Please select a valid PDF file.");
    setPdfFile({ file });
  };

  const handleProcess = async () => {
    if (!pdfFile) return setError("Please upload a PDF file first.");

    setIsProcessing(true);
    setError(null);
    setProgressMessage("Adding page numbers...");
    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF({ orientation: 'p', unit: 'px', hotfixes: ['px_scaling'] });
      
      const arrayBuffer = await pdfFile.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const numPages = pdf.numPages;

      for (let i = 1; i <= numPages; i++) {
        setProgressMessage(`Processing page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        await page.render({ canvasContext: context, viewport }).promise;
        
        // Add text
        context.font = `${fontSize * 2}px Arial`;
        context.fillStyle = '#000000';
        
        const text = format.replace('{p}', String(i)).replace('{n}', String(numPages));
        const textMetrics = context.measureText(text);

        let x, y;
        const [vAlign, hAlign] = position.split('-');

        if (vAlign === 'top') y = margin;
        else y = canvas.height - margin;

        if (hAlign === 'left') {
          context.textAlign = 'left';
          x = margin;
        } else if (hAlign === 'center') {
          context.textAlign = 'center';
          x = canvas.width / 2;
        } else { // right
          context.textAlign = 'right';
          x = canvas.width - margin;
        }
        
        context.fillText(text, x, y);

        // Add to PDF
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
      setDownloadName(pdfFile.file.name.replace(/\.pdf$/i, '_numbered.pdf'));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to add page numbers. The PDF might be corrupted or protected.");
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
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Format ({'{p}'}=page, {'{n}'}=total)</label>
                <input
                  type="text"
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                  className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="{p} / {n}"
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
                <p className="text-xl text-white mt-4">{progressMessage}</p>
            </div>
        )}

        {resultUrl ? (
            <DownloadScreen files={[{url: resultUrl, name: downloadName }]} onStartOver={reset} />
        ) : !pdfFile ? (
            <PdfUpload onFilesSelect={handleFileChange} multiple={false} />
        ) : (
             renderOptions()
        )}
      </div>
    </div>
  );
};