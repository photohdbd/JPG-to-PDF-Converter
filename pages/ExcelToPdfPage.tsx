import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { DownloadScreen } from '../components/DownloadScreen';
import { LoaderIcon, AlertTriangleIcon } from '../components/Icons';
import { BackButton } from '../components/BackButton';
import { Page } from '../App';

declare const XLSX: any;
declare const jspdf: any;

interface ExcelToPdfPageProps {
  onNavigate: (page: Page) => void;
}

export const ExcelToPdfPage: React.FC<ExcelToPdfPageProps> = ({ onNavigate }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

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

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setDownloadName(`${baseName}_LOLOPDF.pdf`);

    try {
      const { jsPDF } = jspdf;
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const doc = new jsPDF('l', 'pt', 'a4');
      
      const numSheets = workbook.SheetNames.length;
      let combinedHtml = '';

      for (const [index, sheetName] of workbook.SheetNames.entries()) {
        setProgress(`Processing sheet ${index + 1} of ${numSheets}: ${sheetName}...`);
        const worksheet = workbook.Sheets[sheetName];
        const html = XLSX.utils.sheet_to_html(worksheet);
        combinedHtml += `<div class="sheet-container"><h2>${sheetName}</h2>${html}</div>`;
        if (index < numSheets - 1) {
             combinedHtml += '<div class="page-break"></div>';
        }
      }

       const styledHtml = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; font-size: 8pt; }
              .page-break { page-break-before: always; }
              .sheet-container { }
              h2 { font-size: 14pt; font-weight: bold; margin-bottom: 10px; }
              table { border-collapse: collapse; width: 100%; font-size: 8pt; table-layout: fixed; word-wrap: break-word; }
              th, td { border: 1px solid #ccc; padding: 4px; text-align: left; overflow-wrap: break-word; }
              th { background-color: #f2f2f2; font-weight: bold; }
            </style>
          </head>
          <body>${combinedHtml}</body>
        </html>
      `;

        await doc.html(styledHtml, {
            callback: function (doc) {
                const pdfBlob = doc.output('blob');
                const url = URL.createObjectURL(pdfBlob);
                setPdfUrl(url);
            },
            margin: [40, 30, 40, 30],
            autoPaging: 'slice',
            width: 780, // A4 landscape width (842) - margins
            windowWidth: 1500,
        });

    } catch (err) {
        console.error(err);
        setError("Failed to convert spreadsheet. The file may be corrupt or in an unsupported format.");
    } finally {
        setIsConverting(false);
        setProgress('');
    }
  };
  
  const reset = () => {
    setIsConverting(false);
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