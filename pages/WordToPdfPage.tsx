import React, { useState, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, WordIcon, ArrowRightIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { useUsage } from '../contexts/UsageContext';

declare const JSZip: any;
declare const jspdf: any;

interface WordToPdfPageProps {
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

export const WordToPdfPage: React.FC<WordToPdfPageProps> = ({ onNavigate }) => {
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const { incrementConversions } = useUsage();

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    reset();
    const file = files[0];
    if (files.length > 1) {
        setError("Please select only one file. The first file has been chosen.");
    }
    
    const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const docMimeType = 'application/msword';
    const docxExtension = '.docx';
    const docExtension = '.doc';

    const fileNameLower = file.name.toLowerCase();
    const isDocx = file.type === docxMimeType || fileNameLower.endsWith(docxExtension);
    const isDoc = file.type === docMimeType || fileNameLower.endsWith(docExtension);

    if (isDoc) {
      setError("The classic .doc format isn't supported. Please re-save as a modern .docx file and try again for best results.");
      return;
    }
    if (!isDocx) {
        setError("The selected file is not a valid Word document (.docx).");
        return;
    }

    setWordFile(file);
  };

    const handleConvertToPdf = async () => {
    if (!wordFile) return;

    setIsConverting(true);
    setError(null);
    setProgressMessage('Unpacking Word document...');

    try {
        const { jsPDF } = jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
        const margin = 40;
        const pdfWidth = doc.internal.pageSize.getWidth() - margin * 2;
        let y = margin;

        const zip = await JSZip.loadAsync(wordFile);

        setProgressMessage('Reading image relationships...');
        const relsFile = zip.file('word/_rels/document.xml.rels');
        const imageRels = new Map<string, string>();
        if (relsFile) {
            const relsText = await relsFile.async('string');
            const relsParser = new DOMParser();
            const relsXml = relsParser.parseFromString(relsText, 'application/xml');
            const relationships = relsXml.getElementsByTagName('Relationship');
            for (let i = 0; i < relationships.length; i++) {
                const rel = relationships[i];
                if (rel.getAttribute('Type')?.endsWith('image')) {
                    const id = rel.getAttribute('Id');
                    const target = rel.getAttribute('Target');
                    if (id && target) {
                        imageRels.set(id, `word/${target}`);
                    }
                }
            }
        }

        setProgressMessage('Loading images...');
        const images = new Map<string, { data: string, type: string }>();
        for (const [id, path] of imageRels.entries()) {
            const imageFile = zip.file(path);
            if (imageFile) {
                const fileData = await imageFile.async('base64');
                const type = path.split('.').pop()?.toUpperCase() || 'PNG';
                images.set(id, { data: `data:image/${type.toLowerCase()};base64,${fileData}`, type });
            }
        }
        
        setProgressMessage('Processing document content...');
        const contentFile = zip.file('word/document.xml');
        if (!contentFile) throw new Error('Could not find document.xml in the DOCX file.');

        const contentText = await contentFile.async('string');
        const parser = new DOMParser();
        const xml = parser.parseFromString(contentText, 'application/xml');
        const paragraphs = xml.getElementsByTagName('w:p');

        const checkAndAddPage = (neededHeight: number) => {
            if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
        };

        for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            const runs = Array.from(p.childNodes).filter(node => node.nodeName === 'w:r');
            let paragraphText = '';
            
            runs.forEach(run => {
                const textElements = (run as Element).getElementsByTagName('w:t');
                if (textElements.length > 0) {
                     paragraphText += Array.from(textElements).map(t => t.textContent).join('');
                }
            });

            if (paragraphText.trim().length > 0) {
                const lines = doc.splitTextToSize(paragraphText, pdfWidth);
                checkAndAddPage(lines.length * doc.getLineHeight());
                doc.text(lines, margin, y);
                y += lines.length * doc.getLineHeight();
            }

            runs.forEach(run => {
                 const blips = (run as Element).getElementsByTagName('a:blip');
                 if (blips.length > 0) {
                    const embedId = blips[0].getAttribute('r:embed');
                    if (embedId && images.has(embedId)) {
                        const imageData = images.get(embedId)!;
                        let imgWidth = 300;
                        let imgHeight = 200;
                        const extent = (run as Element).getElementsByTagName('a:ext')[0];
                        if (extent) {
                            const cx = parseInt(extent.getAttribute('cx') || '0');
                            const cy = parseInt(extent.getAttribute('cy') || '0');
                            if (cx > 0 && cy > 0) {
                                imgWidth = cx / 12700;
                                imgHeight = cy / 12700;
                                if (imgWidth > pdfWidth) {
                                    const ratio = pdfWidth / imgWidth;
                                    imgWidth = pdfWidth;
                                    imgHeight = imgHeight * ratio;
                                }
                            }
                        }

                        checkAndAddPage(imgHeight);
                        doc.addImage(imageData.data, imageData.type, margin, y, imgWidth, imgHeight);
                        y += imgHeight + doc.getLineHeight();
                    }
                }
            });
        }

        setProgressMessage('Finalizing PDF...');
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const originalName = wordFile.name;
        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
        
        setPdfUrl(url);
        setDownloadName(`${baseName}.pdf`);
        incrementConversions();
        setWordFile(null);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during conversion. The file may be corrupt or use unsupported features.");
    } finally {
      setIsConverting(false);
      setProgressMessage('');
    }
  }
  
  const reset = () => {
    setWordFile(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setDownloadName('');
    setError(null);
    setIsConverting(false);
    setProgressMessage('');
  };

  const renderContent = () => {
    if (pdfUrl) {
      return <DownloadScreen files={[{url: pdfUrl, name: downloadName}]} onStartOver={reset} autoDownload={true} />;
    }

    if (wordFile) {
        return (
            <div className="w-full max-w-lg">
                <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8 text-center">
                    <WordIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <p className="font-bold text-black dark:text-white truncate mb-1" title={wordFile.name}>{wordFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{formatBytes(wordFile.size)}</p>
                    
                     <div className="flex gap-4">
                        <button onClick={reset} className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleConvertToPdf} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary transition-colors">
                            Convert to PDF <ArrowRightIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const acceptTypes = ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return (
        <FileUpload 
            onFilesSelect={handleFileChange}
            title="Drag & Drop Your Word File Here"
            accept={acceptTypes}
            description="Supports modern .docx files."
        />
    );
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Word to PDF Converter</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl text-center">
                Convert Microsoft Word (.docx) documents to PDF files right in your browser. Your files are never uploaded to a server.
            </p>
            <div className="bg-yellow-200 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-lg flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="block sm:inline"><b>Note:</b> This converter preserves text and images. Complex layouts, tables, and special formatting may not be fully retained.</span>
            </div>
            {error && (
            <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-lg flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
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
        </div>
    </div>
  );
};
