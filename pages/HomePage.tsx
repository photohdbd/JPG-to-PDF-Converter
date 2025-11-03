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
  FileTextIcon,
  HashIcon,
} from '../components/Icons';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

type Tool = {
  icon: React.ReactNode;
  title: string;
  description: string;
  page: Page | null;
  color: string;
};

const toolCategories: { title: string; tools: Tool[] }[] = [
  {
    title: 'Convert to PDF',
    tools: [
      {
        icon: <ImageIcon className="w-8 h-8" />,
        title: 'JPG to PDF',
        description: 'Convert JPG images to a single PDF file.',
        page: 'jpg-to-pdf',
        color: 'from-red-500 to-orange-600',
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
        icon: <FileTextIcon className="w-8 h-8" />,
        title: 'File to PDF',
        description: 'Convert various images and text files to PDF.',
        page: 'converter',
        color: 'from-blue-500 to-indigo-600',
      },
    ],
  },
  {
    title: 'Convert from PDF',
    tools: [
       {
        icon: <ImageIcon className="w-8 h-8" />,
        title: 'PDF to JPG',
        description: 'Extract all pages of a PDF as JPG images.',
        page: 'pdf-to-jpg',
        color: 'from-red-500 to-orange-600',
      },
      {
        icon: <WordIcon className="w-8 h-8" />,
        title: 'PDF to Word',
        description: 'Convert PDF to an editable Word document.',
        page: 'pdf-to-word',
        color: 'from-sky-500 to-blue-600',
      },
      {
        icon: <PowerpointIcon className="w-8 h-8" />,
        title: 'PDF to PowerPoint',
        description: 'Convert PDF pages to images for PPT.',
        page: 'pdf-to-powerpoint',
        color: 'from-orange-500 to-red-600',
      },
      {
        icon: <ExcelIcon className="w-8 h-8" />,
        title: 'PDF to Excel',
        description: 'Extract data from PDF tables to CSV.',
        page: 'pdf-to-excel',
        color: 'from-lime-500 to-green-600',
      },
    ]
  },
  {
    title: 'Organize PDF',
    tools: [
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
        icon: <RotateIcon className="w-8 h-8" />,
        title: 'Rotate PDF',
        description: 'Rotate one or all pages in your PDF.',
        page: 'rotate',
        color: 'from-fuchsia-500 to-pink-600',
      },
    ]
  },
  {
    title: 'Edit & Secure PDF',
    tools: [
       {
        icon: <EditIcon className="w-8 h-8" />,
        title: 'Sign PDF',
        description: 'Sign your PDF documents with ease.',
        page: 'sign',
        color: 'from-cyan-500 to-teal-600',
      },
       {
        icon: <HashIcon className="w-8 h-8" />,
        title: 'Add Page Numbers',
        description: 'Insert page numbers into your PDF.',
        page: 'add-page-numbers',
        color: 'from-teal-500 to-cyan-600',
      },
      {
        icon: <WatermarkIcon className="w-8 h-8" />,
        title: 'Add Watermark',
        description: 'Add text or image watermark to your PDF.',
        page: 'watermark',
        color: 'from-rose-400 to-red-500',
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
    ]
  }
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full text-center">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
        LOLOPDF
      </h1>
      <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
        Your one-stop solution for converting, merging, editing, and enhancing PDF files.
      </p>

      {toolCategories.map((category) => (
        <div key={category.title} className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-left">{category.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {category.tools.map((tool) => (
              <ToolCard
                key={tool.title}
                {...tool}
                onClick={tool.page ? () => onNavigate(tool.page) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
