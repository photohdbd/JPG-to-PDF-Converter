import React from 'react';
import { Page } from '../App';
import { ToolCard } from '../components/ToolCard';
import {
  ImageIcon,
  MergeIcon,
  SplitIcon,
  CompressIcon,
  WordIcon,
  PowerpointIcon,
  ExcelIcon,
  EditIcon,
  RotateIcon,
  LockIcon,
  UnlockIcon,
  WatermarkIcon,
} from '../components/Icons';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

const tools: {
  // Fix: Use React.ReactNode to avoid "Cannot find namespace 'JSX'" error.
  icon: React.ReactNode;
  title: string;
  description: string;
  page: Page | null;
  color: string;
}[] = [
  {
    icon: <ImageIcon className="w-8 h-8" />,
    title: 'Image/Text to PDF',
    description: 'Convert images and text files to PDF.',
    page: 'converter',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: <MergeIcon className="w-8 h-8" />,
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into one single file.',
    page: 'merge',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: <SplitIcon className="w-8 h-8" />,
    title: 'Split PDF',
    description: 'Extract pages from a PDF file.',
    page: 'split',
    color: 'from-yellow-500 to-amber-600',
  },
  {
    icon: <CompressIcon className="w-8 h-8" />,
    title: 'Compress PDF',
    description: 'Reduce the file size of your PDF.',
    page: 'compress',
    color: 'from-purple-500 to-violet-600',
  },
   {
    icon: <WordIcon className="w-8 h-8" />,
    title: 'Word to PDF',
    description: 'Convert Word documents to PDF.',
    page: 'word',
    color: 'from-sky-500 to-blue-600',
  },
  {
    icon: <PowerpointIcon className="w-8 h-8" />,
    title: 'PowerPoint to PDF',
    description: 'Convert PowerPoint slides to PDF.',
    page: 'powerpoint',
    color: 'from-orange-500 to-red-600',
  },
  {
    icon: <ExcelIcon className="w-8 h-8" />,
    title: 'Excel to PDF',
    description: 'Convert Excel spreadsheets to PDF.',
    page: 'excel',
    color: 'from-lime-500 to-green-600',
  },
  {
    icon: <EditIcon className="w-8 h-8" />,
    title: 'Sign PDF',
    description: 'Sign your PDF documents with ease.',
    page: 'sign',
    color: 'from-cyan-500 to-teal-600',
  },
  {
    icon: <WatermarkIcon className="w-8 h-8" />,
    title: 'Add Watermark',
    description: 'Add text or image watermark to your PDF.',
    page: 'watermark',
    color: 'from-rose-400 to-red-500',
  },
  {
    icon: <RotateIcon className="w-8 h-8" />,
    title: 'Rotate PDF',
    description: 'Rotate one or all pages in your PDF.',
    page: 'rotate',
    color: 'from-fuchsia-500 to-pink-600',
  },
  {
    icon: <LockIcon className="w-8 h-8" />,
    title: 'Protect PDF',
    description: 'Add a password to protect your PDF.',
    page: 'protect',
    color: 'from-slate-500 to-gray-600',
  },
   {
    icon: <UnlockIcon className="w-8 h-8" />,
    title: 'Unlock PDF',
    description: 'Remove password from your PDF file.',
    page: 'unlock',
    color: 'from-indigo-400 to-purple-500',
  },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full text-center">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
        AI PDF Toolkit
      </h1>
      <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
        Your one-stop solution for converting, merging, editing, and enhancing PDFs with the power of AI.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <ToolCard
            key={tool.title}
            {...tool}
            onClick={tool.page ? () => onNavigate(tool.page) : undefined}
          />
        ))}
      </div>
    </div>
  );
};
