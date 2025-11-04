import React, { useState, useEffect, useRef } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon, MousePointerIcon, TypeIcon, SquareIcon, SignatureIcon, Trash2Icon, FilePlus2Icon, ImageIcon, XIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const PDFLib: any;
declare const pdfjsLib: any;
declare const SignaturePad: any;

type Tool = 'select' | 'text' | 'rectangle' | 'image' | 'signature' | 'whiteout';
type ElementType = 'text' | 'rectangle' | 'image' | 'whiteout';

interface Element {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  imageUrl?: string;
}

interface EditPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const EditPdfPage: React.FC<EditPdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File; arrayBuffer: ArrayBuffer } | null>(null);
  const [pages, setPages] = useState<{ dataUrl: string; width: number; height: number; originalWidth: number, originalHeight: number }[]>([]);
  const [elements, setElements] = useState<Record<number, Element[]>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || !files.length) return;
    reset();
    const file = files[0];
    if (file.type !== 'application/pdf') return setError('Please select a valid PDF file.');
    
    setIsProcessing(true);
    setProcessingMessage('Loading PDF...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfFile({ file, arrayBuffer });
      
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const newPages = [];
      const newElements: Record<number, Element[]> = {};

      for (let i = 1; i <= numPages; i++) {
        setProcessingMessage(`Rendering page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext('2d');
        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          newPages.push({ dataUrl: canvas.toDataURL(), width: viewport.width, height: viewport.height, originalWidth: page.view[2], originalHeight: page.view[3] });
        }
        newElements[i-1] = [];
      }
      setPages(newPages);
      setElements(newElements);
    } catch (e) {
      setError('Could not read PDF. It might be corrupt or password protected.');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const addElement = (element: Omit<Element, 'id'>) => {
    const newElement = { ...element, id: `el_${Date.now()}` };
    setElements(prev => ({
      ...prev,
      [currentPageIndex]: [...(prev[currentPageIndex] || []), newElement],
    }));
    return newElement;
  };
  
  const updateElement = (id: string, updates: Partial<Element>) => {
    setElements(prev => ({
      ...prev,
      [currentPageIndex]: prev[currentPageIndex].map(el => el.id === id ? { ...el, ...updates } : el)
    }));
  };
  
  const deleteElement = (id: string) => {
      setElements(prev => ({
      ...prev,
      [currentPageIndex]: prev[currentPageIndex].filter(el => el.id !== id)
    }));
    setSelectedElementId(null);
  };
  
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== editorRef.current) {
        // Click was on an element, not the background
        return;
    }

    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'text') {
        const newTextElement = addElement({
            type: 'text',
            x, y, width: 150, height: 20,
            text: 'New Text', fontSize: 16
        });
        setSelectedElementId(newTextElement.id);
        setActiveTool('select');
    } else {
        setSelectedElementId(null);
    }
  };
  
  const handleAddPage = () => {
    const firstPage = pages[0];
    const width = firstPage?.width || 595; // Default to A4 portrait
    const height = firstPage?.height || 842;
    const originalWidth = firstPage?.originalWidth || 595;
    const originalHeight = firstPage?.originalHeight || 842;
    
    // Create a blank white page as a data URL
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if(ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
    }
    const blankPageDataUrl = canvas.toDataURL();
    
    const newPageIndex = pages.length;
    setPages(prev => [...prev, {dataUrl: blankPageDataUrl, width, height, originalWidth, originalHeight }]);
    setElements(prev => ({...prev, [newPageIndex]: [] }));
    setCurrentPageIndex(newPageIndex);
  };
  
  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
        setError("Cannot delete the last page.");
        return;
    }
    setPages(prev => prev.filter((_, i) => i !== index));
    // Need to shift elements down
    const newElements: Record<number, Element[]> = {};
    for (let i = 0; i < pages.length - 1; i++) {
        if (i < index) {
            newElements[i] = elements[i];
        } else {
            newElements[i] = elements[i+1];
        }
    }
    setElements(newElements);

    if (currentPageIndex >= index) {
        setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    }
  };
  
  const handleSave = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setProcessingMessage('Saving PDF...');
    try {
        const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfFile.arrayBuffer);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        const pageIndicesToRemove = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i)
            .filter(i => !pages[i]); // Doesn't quite work if pages are reordered. Let's do it simpler.
        
        // This process rebuilds the PDF from scratch based on the editor state
        const newPdfDoc = await PDFDocument.create();

        for (let i = 0; i < pages.length; i++) {
            setProcessingMessage(`Processing page ${i + 1} of ${pages.length}...`);
            const editorPage = pages[i];
            const [newPage] = await newPdfDoc.copyPages(pdfDoc, [i < pdfDoc.getPageCount() ? i : 0]);
            
            // If it's a new blank page, we need to create one instead of copying
            const isNewBlankPage = i >= pdfDoc.getPageCount();
            const finalPage = isNewBlankPage ? newPdfDoc.addPage([editorPage.originalWidth, editorPage.originalHeight]) : newPdfDoc.addPage(newPage);

            const scale = editorPage.originalWidth / editorPage.width;
            
            for (const el of elements[i] || []) {
                const props = {
                    x: el.x * scale,
                    y: editorPage.originalHeight - (el.y * scale) - (el.height * scale),
                    width: el.width * scale,
                    height: el.height * scale,
                };

                switch (el.type) {
                    case 'text':
                        finalPage.drawText(el.text || '', {
                            ...props,
                            y: editorPage.originalHeight - (el.y * scale) - ((el.fontSize || 16) * scale), // Adjust Y for text baseline
                            font,
                            size: (el.fontSize || 16) * scale,
                            color: rgb(0, 0, 0)
                        });
                        break;
                    case 'rectangle':
                        finalPage.drawRectangle({...props, borderColor: rgb(0,0,0), borderWidth: 2 });
                        break;
                    case 'whiteout':
                         finalPage.drawRectangle({...props, color: rgb(1,1,1) });
                        break;
                    case 'image':
                        if (el.imageUrl) {
                            const imageBytes = await fetch(el.imageUrl).then(res => res.arrayBuffer());
                            const image = await newPdfDoc.embedPng(imageBytes);
                            finalPage.drawImage(image, props);
                        }
                        break;
                }
            }
        }
        
        const baseName = pdfFile.file.name.replace(/\.[^/.]+$/, "");
        setDownloadName(`${baseName}_edited_LOLOPDF.pdf`);
        
        const pdfBytes = await newPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
        console.error(e);
        setError('Failed to save PDF. An unexpected error occurred.');
    } finally {
        setIsProcessing(false);
    }
  };

  const reset = () => {
    setPdfFile(null);
    setPages([]);
    setElements({});
    setCurrentPageIndex(0);
    setActiveTool('select');
    setSelectedElementId(null);
    setResultUrl(null);
    setDownloadName('');
    setError(null);
  };
  
  const handleSignatureCreated = (signatureUrl: string) => {
      addElement({
          type: 'image',
          x: 50, y: 50, width: 150, height: 75,
          imageUrl: signatureUrl
      });
      setIsSignatureModalOpen(false);
      setActiveTool('select');
  };

  const renderEditor = () => {
    const currentPage = pages[currentPageIndex];
    if (!currentPage) return null;

    return (
      <div className="w-full flex gap-4 h-[calc(100vh-200px)]">
        {/* Toolbar */}
        <div className="flex flex-col gap-2 bg-gray-200 dark:bg-gray-800 p-2 rounded-lg">
          {[{ tool: 'select', icon: <MousePointerIcon/> }, { tool: 'text', icon: <TypeIcon/> }, { tool: 'rectangle', icon: <SquareIcon/> }, { tool: 'image', icon: <ImageIcon/> }, { tool: 'signature', icon: <SignatureIcon/> }, {tool: 'whiteout', icon: <div className="w-5 h-5 border-2 border-current rounded"/>}].map(({tool, icon}) => (
            <button key={tool} onClick={() => setActiveTool(tool as Tool)} className={`p-3 rounded-md ${activeTool === tool ? 'bg-brand-primary text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{icon}</button>
          ))}
        </div>
        
        {/* Page Thumbnails */}
        <div className="w-48 bg-gray-200 dark:bg-gray-800 p-2 rounded-lg overflow-y-auto space-y-2">
            {pages.map((page, index) => (
                <div key={index} className="relative">
                    <img src={page.dataUrl} onClick={() => setCurrentPageIndex(index)} className={`w-full cursor-pointer rounded border-2 ${currentPageIndex === index ? 'border-brand-primary' : 'border-transparent'}`} />
                    <button onClick={() => handleDeletePage(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs">✕</button>
                </div>
            ))}
            <button onClick={handleAddPage} className="w-full h-24 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700">
                <FilePlus2Icon className="w-8 h-8"/>
                <span className="text-xs mt-1">Add Page</span>
            </button>
        </div>

        {/* Editor Canvas */}
        <div className="flex-grow bg-gray-500/20 flex items-center justify-center overflow-auto p-4">
            <div ref={editorRef} onClick={handleEditorClick} className="relative shadow-lg" style={{ width: currentPage.width, height: currentPage.height }}>
                <img src={currentPage.dataUrl} className="w-full h-full" draggable="false" />
                {(elements[currentPageIndex] || []).map(el => (
                    <EditableElement key={el.id} element={el} isSelected={selectedElementId === el.id} onSelect={setSelectedElementId} onUpdate={updateElement} />
                ))}
            </div>
        </div>
        
        {/* Properties Panel */}
        <div className="w-64 bg-gray-200 dark:bg-gray-800 p-3 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Properties</h3>
            {selectedElementId && elements[currentPageIndex]?.find(el => el.id === selectedElementId) ?
             <PropertiesPanel element={elements[currentPageIndex].find(el => el.id === selectedElementId)!} onUpdate={updateElement} onDelete={deleteElement} />
            : <p className="text-sm text-gray-500 dark:text-gray-400">Select an element to edit its properties.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Homemade+Apple&display=swap');`}</style>
      <div className="flex justify-between items-center">
        <BackButton onClick={() => onNavigate('home')} />
        {pdfFile && <button onClick={handleSave} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary">Save & Download</button>}
      </div>
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">PDF Editor</h1>
        <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">Add text, shapes, signatures, and more. Manage pages with ease.</p>
        
        {error && <div className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded mb-4 w-full flex items-center"><AlertTriangleIcon className="w-5 h-5 mr-2" />{error}<button onClick={() => setError(null)} className="ml-auto font-bold">X</button></div>}
        {isProcessing && <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50"><LoaderIcon /><p className="text-xl text-white mt-4">{processingMessage}</p></div>}
        
        {isSignatureModalOpen && <SignatureModal onSignatureCreated={handleSignatureCreated} onClose={() => setIsSignatureModalOpen(false)} />}
        
        {resultUrl ? <DownloadScreen files={[{ url: resultUrl, name: downloadName }]} onStartOver={reset} />
        : !pdfFile ? <PdfUpload onFilesSelect={handleFileChange} multiple={false} />
        : renderEditor()}
      </div>
    </div>
  );
};


const EditableElement: React.FC<{element: Element, isSelected: boolean, onSelect: (id: string) => void, onUpdate: (id: string, updates: Partial<Element>) => void}> = ({element, isSelected, onSelect, onUpdate}) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(element.id);
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                onUpdate(element.id, { x: element.x + e.movementX, y: element.y + e.movementY });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, element.id, element.x, element.y, onUpdate]);

    const borderClass = isSelected ? 'border-2 border-brand-primary' : 'border-2 border-transparent hover:border-brand-primary/50 border-dashed';
    const commonStyle: React.CSSProperties = {
        position: 'absolute',
        left: element.x, top: element.y,
        width: element.width, height: element.height,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    switch (element.type) {
        case 'text':
            return <textarea 
                        value={element.text}
                        onChange={(e) => onUpdate(element.id, { text: e.target.value })}
                        onMouseDown={handleMouseDown}
                        style={{ ...commonStyle, fontSize: element.fontSize, background: 'transparent', resize: 'none', border: 'none', outline: 'none', color: 'black' }}
                        className={`p-0 ${borderClass}`}
                    />
        case 'image':
            return <div onMouseDown={handleMouseDown} style={commonStyle} className={borderClass}><img src={element.imageUrl} className="w-full h-full" draggable="false"/></div>
        case 'rectangle':
            return <div onMouseDown={handleMouseDown} style={{...commonStyle, border: '2px solid black'}} className={borderClass}></div>
        case 'whiteout':
            return <div onMouseDown={handleMouseDown} style={{...commonStyle, backgroundColor: 'white'}} className={borderClass}></div>
        default:
            return null;
    }
};

const PropertiesPanel: React.FC<{element: Element, onUpdate: (id: string, updates: Partial<Element>) => void, onDelete: (id: string) => void}> = ({element, onUpdate, onDelete}) => {
    return (
        <div className="space-y-4">
            <p className="font-semibold capitalize">{element.type} Properties</p>
            {element.type === 'text' && (
                <div>
                    <label className="text-sm">Font Size</label>
                    <input type="number" value={element.fontSize} onChange={e => onUpdate(element.id, {fontSize: parseInt(e.target.value)})} className="w-full p-1 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
            )}
             <div>
                <label className="text-sm">Dimensions (W x H)</label>
                <div className="flex gap-2">
                    <input type="number" value={Math.round(element.width)} onChange={e => onUpdate(element.id, {width: parseInt(e.target.value)})} className="w-1/2 p-1 bg-gray-100 dark:bg-gray-700 rounded" />
                    <input type="number" value={Math.round(element.height)} onChange={e => onUpdate(element.id, {height: parseInt(e.target.value)})} className="w-1/2 p-1 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
            </div>
             <div>
                <label className="text-sm">Position (X, Y)</label>
                <div className="flex gap-2">
                    <input type="number" value={Math.round(element.x)} onChange={e => onUpdate(element.id, {x: parseInt(e.target.value)})} className="w-1/2 p-1 bg-gray-100 dark:bg-gray-700 rounded" />
                    <input type="number" value={Math.round(element.y)} onChange={e => onUpdate(element.id, {y: parseInt(e.target.value)})} className="w-1/2 p-1 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
            </div>
            <button onClick={() => onDelete(element.id)} className="w-full mt-4 flex items-center justify-center gap-2 p-2 bg-red-600 text-white rounded hover:bg-red-700"><Trash2Icon className="w-4 h-4"/> Delete Element</button>
        </div>
    );
};

const SignatureModal: React.FC<{onSignatureCreated: (url: string) => void, onClose: () => void}> = ({onSignatureCreated, onClose}) => {
    const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
    const [typedText, setTypedText] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<any>(null);

    useEffect(() => {
        if (mode === 'draw' && canvasRef.current) {
            signaturePadRef.current = new SignaturePad(canvasRef.current, { backgroundColor: 'rgb(240, 240, 240)' });
            // resize logic
            const canvas = canvasRef.current;
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d")?.scale(ratio, ratio);
            signaturePadRef.current.clear();
        }
    }, [mode]);
    
    const handleCreate = () => {
        if (mode === 'draw' && signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            onSignatureCreated(signaturePadRef.current.toDataURL('image/png'));
        } else if (mode === 'type' && typedText) {
            const canvas = document.createElement('canvas');
            canvas.width = 400; canvas.height = 150;
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.font = '50px "Homemade Apple", cursive';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(typedText, canvas.width/2, canvas.height/2);
                onSignatureCreated(canvas.toDataURL('image/png'));
            }
        }
    };
    
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => onSignatureCreated(event.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-2 right-2 p-1"><XIcon className="w-6 h-6"/></button>
                <h3 className="text-lg font-bold mb-4">Create Signature</h3>
                <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button onClick={() => setMode('draw')} className={`px-4 py-2 ${mode === 'draw' ? 'border-b-2 border-brand-primary' : ''}`}>Draw</button>
                    <button onClick={() => setMode('type')} className={`px-4 py-2 ${mode === 'type' ? 'border-b-2 border-brand-primary' : ''}`}>Type</button>
                    <button onClick={() => setMode('upload')} className={`px-4 py-2 ${mode === 'upload' ? 'border-b-2 border-brand-primary' : ''}`}>Upload</button>
                </div>
                {mode === 'draw' && <div className="bg-gray-200 rounded"><canvas ref={canvasRef} className="w-full h-48"></canvas><button onClick={() => signaturePadRef.current?.clear()} className="w-full text-center py-1 text-sm">Clear</button></div>}
                {mode === 'type' && <input type="text" value={typedText} onChange={e => setTypedText(e.target.value)} className="w-full p-4 text-3xl bg-gray-100 dark:bg-gray-700 rounded text-center" style={{fontFamily: '"Homemade Apple", cursive'}} />}
                {mode === 'upload' && <input type="file" accept="image/png" onChange={handleUpload} className="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded" />}
                {mode !== 'upload' && <button onClick={handleCreate} className="w-full mt-4 bg-brand-primary text-white py-2 rounded">Create & Use</button>}
            </div>
        </div>
    );
};