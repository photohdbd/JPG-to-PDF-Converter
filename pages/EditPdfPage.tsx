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

interface PageState {
  dataUrl: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  originalPageIndex: number | null; // null for new pages
}


interface EditPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const EditPdfPage: React.FC<EditPdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File; arrayBuffer: ArrayBuffer } | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
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
      const newPages: PageState[] = [];
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
          newPages.push({ dataUrl: canvas.toDataURL(), width: viewport.width, height: viewport.height, originalWidth: page.view[2], originalHeight: page.view[3], originalPageIndex: i - 1 });
        }
        newElements[i-1] = [];
      }
      setPages(newPages);
      setElements(newElements);
    } catch (e) {
      setError('Could not read PDF. It may be corrupt or password protected.');
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
        if (!e.currentTarget.contains(e.target as Node) || e.target === e.currentTarget) {
            setSelectedElementId(null);
        }
        return;
    }

    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch(activeTool) {
        case 'text': {
            const newEl = addElement({ type: 'text', x, y, width: 150, height: 20, text: 'New Text', fontSize: 16 });
            setSelectedElementId(newEl.id);
            setActiveTool('select');
            break;
        }
        case 'rectangle': {
            const newEl = addElement({ type: 'rectangle', x, y, width: 100, height: 50 });
            setSelectedElementId(newEl.id);
            setActiveTool('select');
            break;
        }
        case 'whiteout': {
            const newEl = addElement({ type: 'whiteout', x, y, width: 100, height: 50 });
            setSelectedElementId(newEl.id);
            setActiveTool('select');
            break;
        }
        case 'image': {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/png, image/jpeg';
            input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const newEl = addElement({ type: 'image', x, y, width: 150, height: 100, imageUrl: event.target?.result as string });
                    setSelectedElementId(newEl.id);
                };
                reader.readAsDataURL(file);
            };
            input.click();
            setActiveTool('select');
            break;
        }
        case 'signature':
            setIsSignatureModalOpen(true);
            break;
        default:
            setSelectedElementId(null);
            break;
    }
  };
  
  const handleAddPage = () => {
    const firstPage = pages[0];
    const width = firstPage?.width || 892; 
    const height = firstPage?.height || 1262;
    const originalWidth = firstPage?.originalWidth || 595;
    const originalHeight = firstPage?.originalHeight || 842;
    
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
    setPages(prev => [...prev, {dataUrl: blankPageDataUrl, width, height, originalWidth, originalHeight, originalPageIndex: null }]);
    setElements(prev => ({...prev, [newPageIndex]: [] }));
    setCurrentPageIndex(newPageIndex);
  };
  
  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
        setError("Cannot delete the last page.");
        return;
    }
    setPages(prev => prev.filter((_, i) => i !== index));
    
    const newElements = { ...elements };
    delete newElements[index];
    for (let i = index; i < pages.length - 1; i++) {
        newElements[i] = newElements[i + 1];
    }
    delete newElements[pages.length - 1];
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
        const { PDFDocument, rgb, StandardFonts } = PDFLib;
        const sourcePdfDoc = await PDFDocument.load(pdfFile.arrayBuffer);
        const finalPdfDoc = await PDFDocument.create();
        const font = await finalPdfDoc.embedFont(StandardFonts.Helvetica);
        
        for (let i = 0; i < pages.length; i++) {
            setProcessingMessage(`Processing page ${i + 1} of ${pages.length}...`);
            const editorPage = pages[i];
            let finalPage;

            if (editorPage.originalPageIndex !== null && editorPage.originalPageIndex < sourcePdfDoc.getPageCount()) {
                const [copiedPage] = await finalPdfDoc.copyPages(sourcePdfDoc, [editorPage.originalPageIndex]);
                finalPage = finalPdfDoc.addPage(copiedPage);
            } else {
                finalPage = finalPdfDoc.addPage([editorPage.originalWidth, editorPage.originalHeight]);
            }
            
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
                            x: props.x,
                            y: editorPage.originalHeight - (el.y * scale) - ((el.fontSize || 16) * scale * 0.85),
                            font,
                            size: (el.fontSize || 16) * scale,
                            color: rgb(0, 0, 0),
                            lineHeight: ((el.fontSize || 16) * 1.2) * scale,
                        });
                        break;
                    case 'rectangle':
                        finalPage.drawRectangle({...props, borderColor: rgb(0,0,0), borderWidth: 2 * scale, color: undefined });
                        break;
                    case 'whiteout':
                         finalPage.drawRectangle({...props, color: rgb(1,1,1) });
                        break;
                    case 'image':
                        if (el.imageUrl) {
                            const imageBytes = await fetch(el.imageUrl).then(res => res.arrayBuffer());
                            const image = el.imageUrl.startsWith('data:image/png')
                                ? await finalPdfDoc.embedPng(imageBytes)
                                : await finalPdfDoc.embedJpg(imageBytes);
                            finalPage.drawImage(image, props);
                        }
                        break;
                }
            }
        }
        
        const baseName = pdfFile.file.name.replace(/\.[^/.]+$/, "");
        setDownloadName(`${baseName}_edited_LOLOPDF.pdf`);
        
        const pdfBytes = await finalPdfDoc.save();
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

    const toolbarTools = [
      { tool: 'select', icon: <MousePointerIcon className="w-5 h-5"/>, name: 'Select' }, 
      { tool: 'text', icon: <TypeIcon className="w-5 h-5"/>, name: 'Text' }, 
      { tool: 'rectangle', icon: <SquareIcon className="w-5 h-5"/>, name: 'Shape' }, 
      { tool: 'image', icon: <ImageIcon className="w-5 h-5"/>, name: 'Image' }, 
      { tool: 'signature', icon: <SignatureIcon className="w-5 h-5"/>, name: 'Sign' }, 
      { tool: 'whiteout', icon: <div className="w-5 h-5 border-2 border-current rounded bg-white"/>, name: 'Whiteout' }
    ];

    return (
      <div className="w-full flex flex-col h-[calc(100vh-250px)]">
        {/* Top Toolbar */}
        <div className="flex justify-between items-center bg-gray-200 dark:bg-gray-800 p-2 rounded-lg mb-4">
          <div className="flex gap-1">
            {toolbarTools.map(({tool, icon, name}) => (
              <button key={tool} title={name} onClick={() => setActiveTool(tool as Tool)} className={`p-3 rounded-md ${activeTool === tool ? 'bg-brand-primary text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{icon}</button>
            ))}
          </div>
           {selectedElementId && <button onClick={() => deleteElement(selectedElementId)} className="p-3 rounded-md bg-red-600 text-white hover:bg-red-700"><Trash2Icon className="w-5 h-5"/></button>}
        </div>
        
        <div className="flex gap-4 flex-grow min-h-0">
          {/* Page Thumbnails */}
          <div className="w-48 bg-gray-200 dark:bg-gray-800 p-2 rounded-lg overflow-y-auto space-y-2">
              {pages.map((page, index) => (
                  <div key={page.dataUrl + index} className="relative">
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
          <div className="flex-grow bg-gray-500/20 flex items-center justify-center overflow-auto p-4 rounded-lg">
              <div ref={editorRef} onClick={handleEditorClick} className="relative shadow-lg" style={{ width: currentPage.width, height: currentPage.height }}>
                  <img src={currentPage.dataUrl} className="w-full h-full" draggable="false" />
                  {(elements[currentPageIndex] || []).map(el => (
                      <EditableElement key={el.id} element={el} isSelected={selectedElementId === el.id} onSelect={setSelectedElementId} onUpdate={updateElement} />
                  ))}
              </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl flex flex-col">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Homemade+Apple&display=swap');`}</style>
      <div className="flex justify-between items-center mb-4">
        <BackButton onClick={() => onNavigate('home')} />
        {pdfFile && <button onClick={handleSave} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-brand-secondary">Save & Download</button>}
      </div>
      <div className="w-full flex flex-col items-center justify-center">
        { !pdfFile && <>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">PDF Editor</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">Add text, shapes, signatures, and more. Manage pages with ease.</p>
        </> }
        
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
            return isSelected ? 
                   <textarea 
                        value={element.text}
                        onChange={(e) => onUpdate(element.id, { text: e.target.value, height: e.target.scrollHeight })}
                        onMouseDown={handleMouseDown}
                        style={{ ...commonStyle, fontSize: element.fontSize, background: 'rgba(79, 70, 229, 0.1)', resize: 'both', color: 'black' }}
                        className={`p-0 ${borderClass}`}
                        autoFocus
                    />
                    :
                    <div 
                        onMouseDown={handleMouseDown}
                        style={{...commonStyle, fontSize: element.fontSize, whiteSpace: 'pre-wrap', overflow: 'hidden'}}
                        className={borderClass}
                    >{element.text}</div>
        case 'image':
            return <div onMouseDown={handleMouseDown} style={commonStyle} className={borderClass}><img src={element.imageUrl} className="w-full h-full object-contain" draggable="false"/></div>
        case 'rectangle':
            return <div onMouseDown={handleMouseDown} style={{...commonStyle, border: '2px solid black'}} className={`${borderClass} box-border`}></div>
        case 'whiteout':
            return <div onMouseDown={handleMouseDown} style={{...commonStyle, backgroundColor: 'white'}} className={borderClass}></div>
        default:
            return null;
    }
};

const SignatureModal: React.FC<{onSignatureCreated: (url: string) => void, onClose: () => void}> = ({onSignatureCreated, onClose}) => {
    const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
    const [typedText, setTypedText] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<any>(null);

    useEffect(() => {
        if (mode === 'draw' && canvasRef.current) {
            signaturePadRef.current = new SignaturePad(canvasRef.current, { backgroundColor: 'rgb(240, 240, 240)' });
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-2 right-2 p-1"><XIcon className="w-6 h-6"/></button>
                <h3 className="text-lg font-bold mb-4">Create Signature</h3>
                <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button onClick={() => setMode('draw')} className={`px-4 py-2 text-sm font-semibold ${mode === 'draw' ? 'border-b-2 border-brand-primary text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Draw</button>
                    <button onClick={() => setMode('type')} className={`px-4 py-2 text-sm font-semibold ${mode === 'type' ? 'border-b-2 border-brand-primary text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Type</button>
                    <button onClick={() => setMode('upload')} className={`px-4 py-2 text-sm font-semibold ${mode === 'upload' ? 'border-b-2 border-brand-primary text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Upload</button>
                </div>
                {mode === 'draw' && <div className="bg-gray-200 rounded"><canvas ref={canvasRef} className="w-full h-48"></canvas><button onClick={() => signaturePadRef.current?.clear()} className="w-full text-center py-1 text-sm">Clear</button></div>}
                {mode === 'type' && <input type="text" value={typedText} onChange={e => setTypedText(e.target.value)} className="w-full p-4 text-3xl bg-gray-100 dark:bg-gray-700 rounded text-center" style={{fontFamily: '"Homemade Apple", cursive'}} placeholder="Your Name" />}
                {mode === 'upload' && <input type="file" accept="image/png, image/jpeg" onChange={handleUpload} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30" />}
                {mode !== 'upload' && <button onClick={handleCreate} className="w-full mt-4 bg-brand-primary text-white py-2 rounded">Create & Use</button>}
            </div>
        </div>
    );
};