import React, { useState, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';
import { callStirlingApi } from '../utils';

interface ExcelToPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const ExcelToPdfPage: React.FC<ExcelToPdfPageProps> = ({ onNavigate }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

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
    const isXlsx = fileName.endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const isXls = fileName.endsWith('.xls') || file.type === 'application/vnd.ms-excel';

    if (isXls) {
      setError("Unsupported .xls format. Please re-save your spreadsheet as a modern .xlsx file and try again.");
      return;
    }

    if (!isXlsx) {
      setError("Invalid file type. Please upload a .xlsx file.");
      return;
    }

    setIsConverting(true);
    setError(null);
    setProgress('Initializing...');

    try {
        const formData = new FormData();
        formData.append('file', file);
        const { blob, filename } = await callStirlingApi('/convert-to-pdf', formData, setProgress);
        
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setDownloadName(filename);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to convert spreadsheet. The file may be corrupt or in an unsupported format.");
    } finally {
        setIsConverting(false);
        setProgress('');
    }
  };
  
  const reset = () => {
    setIsConverting(false);
    if(pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setDownloadName('');
    setError(null);
    setProgress('');
  };

  return (
    <div className="w-full max-w-4xl flex flex-col">
        <BackButton onClick={() => onNavigate('home')} />
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Excel to PDF Converter</h1>
            <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl text-center">
                Convert your Excel (.xlsx) spreadsheets into PDF documents, with each sheet on a new page.
            </p>
            {error && (
            <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-4xl flex items-center shadow-lg">
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
                 <p className="text-xl text-white mt-4">Converting Spreadsheet...</p>
                 <p className="text-md text-gray-300 mt-2">{progress}</p>
            </div>
            )}

            {pdfUrl ? (
                <DownloadScreen files={[{url: pdfUrl, name: downloadName}]} onStartOver={reset} />
            ) : (
                <FileUpload 
                    onFilesSelect={handleFileChange}
                    title="Drag & Drop Your Excel File Here"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    description="Supports .xlsx files. Classic .xls format is not supported."
                />
            )}
        </div>
    </div>
  );
};