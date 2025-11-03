import React, { useRef, useEffect, useState } from 'react';
import { DownloadIcon, RefreshCwIcon, CheckCircleIcon } from './Icons';

declare const JSZip: any;

interface DownloadableFile {
  url: string;
  name: string;
}

interface DownloadScreenProps {
  onStartOver: () => void;
  files?: DownloadableFile[];
  zipFileName?: string;
  autoDownload?: boolean;
  details?: React.ReactNode;
}

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const DownloadScreen: React.FC<DownloadScreenProps> = ({
  onStartOver,
  files = [],
  zipFileName = "download.zip",
  autoDownload = false,
  details,
}) => {
  const mainDownloadLinkRef = useRef<HTMLAnchorElement>(null);
  const [isZipping, setIsZipping] = useState(false);

  const isSingleFile = files.length === 1;

  useEffect(() => {
    if (autoDownload && mainDownloadLinkRef.current) {
      mainDownloadLinkRef.current.click();
    }
  }, [autoDownload, files]);

  const handleDownloadAllAsZip = async () => {
    if (files.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      await Promise.all(files.map(async (file) => {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(file.name, blob);
      }));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);

      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = zipFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error("Failed to create zip file", err);
      // You might want to show an error to the user here
    } finally {
      setIsZipping(false);
    }
  };

  const primaryAction = isSingleFile ? (
    <a
      ref={mainDownloadLinkRef}
      href={files[0].url}
      download={files[0].name}
      className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-primary text-white font-bold text-lg rounded-lg shadow-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-brand-primary transition-all duration-300 transform hover:scale-105"
    >
      <DownloadIcon className="w-6 h-6" />
      Download File
    </a>
  ) : (
    <button
      onClick={handleDownloadAllAsZip}
      disabled={isZipping}
      className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-primary text-white font-bold text-lg rounded-lg shadow-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-brand-primary transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500"
    >
      <DownloadIcon className="w-6 h-6" />
      {isZipping ? 'Zipping...' : `Download All (.zip)`}
    </button>
  );

  return (
    <div className="w-full max-w-md text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 rounded-xl shadow-2xl">
      <CheckCircleIcon className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Success!</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{autoDownload ? "Your file is downloading automatically." : "Your file is ready to download."}</p>
      
      {details && (
        <div className="my-6 text-left text-sm p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
          {details}
        </div>
      )}

      {primaryAction}
      
      <button
        onClick={onStartOver}
        className="w-full mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        <RefreshCwIcon className="w-5 h-5" />
        Start Over
      </button>
    </div>
  );
};