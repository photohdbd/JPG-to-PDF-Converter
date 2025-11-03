import React, { useRef, useEffect } from 'react';
import { DownloadIcon, RefreshCwIcon, CheckCircleIcon } from './Icons';

interface DownloadScreenProps {
  pdfUrl: string;
  onStartOver: () => void;
  fileName?: string;
  autoDownload?: boolean;
  details?: React.ReactNode;
}

export const DownloadScreen: React.FC<DownloadScreenProps> = ({
  pdfUrl,
  onStartOver,
  fileName = "converted.pdf",
  autoDownload = false,
  details,
}) => {
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (autoDownload && downloadLinkRef.current) {
      downloadLinkRef.current.click();
    }
  }, [autoDownload, pdfUrl]);

  return (
    <div className="w-full max-w-md text-center bg-gray-800 border border-gray-700 p-8 rounded-xl shadow-2xl">
      <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
      <p className="text-gray-400 mb-6">{autoDownload ? "Your file is downloading automatically." : "Your file is ready to download."}</p>
      
      {details && (
        <div className="my-6 text-left text-sm p-4 bg-gray-700/50 rounded-lg border border-gray-600 text-gray-300">
          {details}
        </div>
      )}

      <a
        ref={downloadLinkRef}
        href={pdfUrl}
        download={fileName}
        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-primary text-white font-bold text-lg rounded-lg shadow-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-primary transition-all duration-300 transform hover:scale-105"
      >
        <DownloadIcon className="w-6 h-6" />
        Download PDF
      </a>
      
      <button
        onClick={onStartOver}
        className="w-full mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors"
      >
        <RefreshCwIcon className="w-5 h-5" />
        Start Over
      </button>
    </div>
  );
};