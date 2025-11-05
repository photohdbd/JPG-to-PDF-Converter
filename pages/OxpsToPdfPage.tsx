import React, { useState, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, FileTextIcon, ArrowRightIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { useUsage } from '../contexts/UsageContext';

declare const JSZip: any;
declare const jspdf: any;

interface OxpsToPdfPageProps {
  onNavigate: (page: Page) => void;
}

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const OxpsToPdfPage: React.FC<OxpsToPdfPageProps> = ({ onNavigate }) => {
  const [oxpsFile, setOxpsFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const { incrementConversions } = useUsage();

  useEffect(() => {
    return () => {
        if(pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);


  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    reset();
    const file = files[0];
    
    if (files.length > 1) {
        setError("Please select only one file. The first file has been chosen.");
    }
    
    const fileName = file.name.toLowerCase();
    const isOxps = fileName.endsWith('.oxps') || file.type === 'application/oxps';

    if (!isOxps) {
      setError("Invalid file type. Please upload a .oxps file.");
      return;
    }

    setOxpsFile(file);
  };
  
  const handleConvert = async () => {
    if (!oxpsFile) return;

    setIsConverting(true);
    setError(null);
    setProgress('Initializing PDF conversion...');

    try {
        const { jsPDF } = jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
        
        const zip = await JSZip.loadAsync(oxpsFile);
        const parser = new DOMParser();

        setProgress('Reading document structure...');
        const fdseqFile = zip.file(/fixeddocumentsequence\.fdseq$/i)[0];
        if (!fdseqFile) throw new Error('Invalid OXPS: FixedDocumentSequence.fdseq not found.');
        const fdseqText = await fdseqFile.async('string');
        const fdseqXml = parser.parseFromString(fdseqText, 'application/xml');
        const docRef = fdseqXml.getElementsByTagName('DocumentReference')[0];
        const fdocPath = docRef?.getAttribute('Source')?.replace(/^\//, '');
        if (!fdocPath) throw new Error('Invalid OXPS: Document path not found.');

        const fdocFile = zip.file(fdocPath);
        if (!fdocFile) throw new Error(`Invalid OXPS: FixedDocument not found at ${fdocPath}`);
        const fdocText = await fdocFile.async('string');
        const fdocXml = parser.parseFromString(fdocText, 'application/xml');
        const pageContentTags = fdocXml.getElementsByTagName('PageContent');
        const fdocDir = fdocPath.substring(0, fdocPath.lastIndexOf('/'));
        const pagePaths = Array.from(pageContentTags).map(tag => {
            const source = tag.getAttribute('Source');
            if (!source) return null;
            return source.startsWith('/') ? source.substring(1) : `${fdocDir}/${source}`;
        }).filter((p): p is string => p !== null);

        if (pagePaths.length === 0) throw new Error('No pages found in the OXPS document.');
        
        const imageCache = new Map<string, string>();

        for (const [index, pagePath] of pagePaths.entries()) {
            setProgress(`Processing page ${index + 1} of ${pagePaths.length}...`);
            if (index > 0) doc.addPage();
            
            const pageFile = zip.file(pagePath);
            if (!pageFile) continue;

            const pageText = await pageFile.async('string');
            const pageXml = parser.parseFromString(pageText, 'application/xml');

            const imageBrushes = pageXml.getElementsByTagName('ImageBrush');
            if(imageBrushes.length > 0) {
              const imageSource = imageBrushes[0].getAttribute('ImageSource');
              if (imageSource) {
                 const pageDir = pagePath.substring(0, pagePath.lastIndexOf('/'));
                 const imagePath = imageSource.replace(/^\//, '').split('/').reduce((acc, part) => {
                    if (part === '..') acc.pop(); else if (part !== '.') acc.push(part);
                    return acc;
                 }, pageDir.split('/')).join('/');

                 let dataUrl = imageCache.get(imagePath);
                 if (!dataUrl) {
                    const imageFile = zip.file(imagePath);
                    if (imageFile) {
                        const base64Data = await imageFile.async('base64');
                        const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'png';
                        const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                        dataUrl = `data:${mimeType};base64,${base64Data}`;
                        imageCache.set(imagePath, dataUrl);
                    }
                 }
                 if (dataUrl) {
                    const { width: pageWidth, height: pageHeight } = doc.internal.pageSize;
                    doc.addImage(dataUrl, 'auto', 0, 0, pageWidth, pageHeight);
                 }
              }
            }
            
            const glyphs = pageXml.getElementsByTagName('Glyphs');
            for (const glyph of Array.from(glyphs)) {
                const text = glyph.getAttribute('UnicodeString');
                const x = parseFloat(glyph.getAttribute('OriginX') || '0');
                const y = parseFloat(glyph.getAttribute('OriginY') || '0');
                const size = parseFloat(glyph.getAttribute('FontRenderingEmSize') || '12');

                if (text) {
                    const xpsUnitToPt = (unit: number) => unit * 72 / 96;
                    doc.setFontSize(xpsUnitToPt(size));
                    
                    const fill = glyph.getAttribute('Fill') || '#FF000000';
                    const hexColor = `#${fill.substring(3)}`;
                    doc.setTextColor(hexColor);
                    
                    doc.text(text, xpsUnitToPt(x), xpsUnitToPt(y));
                }
            }
        }
        
        setProgress('Finalizing PDF...');
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const originalName = oxpsFile.name;
        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
        
        setPdfUrl(url);
        setDownloadName(`${baseName}.pdf`);
        incrementConversions();
        setOxpsFile(null);

    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to convert OXPS file. The file may be corrupt or use unsupported features.");
    } finally {
        setIsConverting(false);
        setProgress('');
    }
  }

  const reset = () => {
    setOxpsFile(null);
    setIsConverting(false);
    if(pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setError(null);
    setProgress('');
    setDownloadName('');
  };
  
  const renderContent = () => {
    if (pdfUrl) {
      return <DownloadScreen files={[{ url: pdfUrl, name: downloadName }]} onStartOver={reset} autoDownload={true} />;
    }
    
    if (oxpsFile) {
        return (
             <div className="w-full max-w-lg">
                <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8 text-center">
                    <FileTextIcon className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                    <p className="font-bold text-black dark:text-white truncate mb-1" title={oxpsFile.name}>{oxpsFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{formatBytes(oxpsFile.size)}</p>
                    
                     <div className="flex gap-4">
                        <button onClick={reset} className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleConvert} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary transition-colors">
                            Convert to PDF <ArrowRightIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <FileUpload 
            onFilesSelect={handleFileChange}
            title="Drag & Drop Your OXPS File Here"
            accept=".oxps,application/oxps"
            description="Supports .oxps files."
        />
    )
  }

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">OXPS to PDF Converter</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl text-center">
                Convert your OXPS documents into a high-quality PDF document.
            </p>
            <div className="bg-yellow-200 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-lg flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="block sm:inline"><b>Note:</b> This in-browser converter supports text and images. Complex layouts, vector graphics, and special fonts may not be fully preserved.</span>
            </div>
            {error && (
            <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-lg flex items-center shadow-lg">
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
                <p className="text-xl text-white mt-4">Converting Document...</p>
                <p className="text-md text-gray-300 mt-2">{progress}</p>
            </div>
            )}
            {renderContent()}
        </div>
    </div>
  );
};