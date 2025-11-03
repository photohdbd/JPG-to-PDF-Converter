import React, { useState } from 'react';
import { PdfUpload } from '../components/PdfUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const PDFLib: any;

interface UnlockPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const UnlockPdfPage: React.FC<UnlockPdfPageProps> = ({ onNavigate }) => {
  const [pdfFile, setPdfFile] = useState<{ file: File; arrayBuffer: ArrayBuffer } | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    if (!password) return setError("Please enter the password.");

    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument, PasswordResponses } = PDFLib;
      const pdfDoc = await PDFDocument.load(pdfFile.arrayBuffer, {
          ownerPassword: password,
          // Try user password if owner fails
          passwordCallback: (isUserPassword) => isUserPassword ? password : PasswordResponses.DISMISS,
      });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError("Failed to unlock PDF. The password may be incorrect or the file corrupted.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPdfFile(null);
    setPassword('');
    setResultUrl(null);
    setError(null);
  };
  
  const renderOptions = () => (
    <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center shadow-lg">
        <p className="text-lg font-bold mb-4">Enter Password to Unlock {pdfFile?.file.name}</p>
        <input 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder="Enter password"
        />
        <button onClick={handleProcess} className="w-full bg-brand-primary text-white font-bold py-3 mt-2 rounded-lg hover:bg-brand-secondary">Unlock PDF</button>
    </div>
  );

  return (
    <div className="w-full max-w-4xl flex flex-col">
      <BackButton onClick={() => onNavigate('home')} />
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white">Unlock PDF</h1>
        <p className="text-md md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl text-center">Remove password protection from your PDF files. You must know the correct password.</p>
        {error && (
            <div className="bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full max-w-lg flex items-center shadow-lg">
                <AlertTriangleIcon className="w-5 h-5 mr-3" />
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3"><span className="text-xl">×</span></button>
            </div>
        )}
        {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                <LoaderIcon />
                <p className="text-xl text-white mt-4">Unlocking PDF...</p>
            </div>
        )}

        {resultUrl ? (
            <DownloadScreen files={[{url: resultUrl, name: "unlocked.pdf"}]} onStartOver={reset} />
        ) : !pdfFile ? (
            <PdfUpload onFilesSelect={handleFileChange} multiple={false} />
        ) : (
             renderOptions()
        )}
      </div>
    </div>
  );
};