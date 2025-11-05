
import React, { useState } from 'react';
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
  RotateIcon,
  LockIcon,
  UnlockIcon,
  WatermarkIcon,
  FileTextIcon,
  HashIcon,
  FilePlus2Icon,
  BookOpenIcon,
  PaletteIcon,
  DraftingCompassIcon,
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
    title: 'Popular PDF Tools',
    tools: [
      {
        icon: <ImageIcon className="w-10 h-10" />,
        title: 'PDF to JPG',
        description: 'Extract all pages of a PDF as JPG images.',
        page: 'pdf-to-jpg',
        color: 'from-red-500 to-orange-600',
      },
      {
        icon: <ImageIcon className="w-10 h-10" />,
        title: 'JPG to PDF',
        description: 'Convert JPG images to a single PDF file.',
        page: 'jpg-to-pdf',
        color: 'from-red-500 to-orange-600',
      },
      {
        icon: <MergeIcon className="w-10 h-10" />,
        title: 'Merge PDF',
        description: 'Combine multiple PDFs into one single file.',
        page: 'merge',
        color: 'from-green-500 to-emerald-600',
      },
      {
        icon: <SplitIcon className="w-10 h-10" />,
        title: 'Split PDF',
        description: 'Extract pages from a PDF file.',
        page: 'split',
        color: 'from-yellow-500 to-amber-600',
      },
      {
        icon: <FilePlus2Icon className="w-10 h-10" />,
        title: 'Add Pages to PDF',
        description: 'Add image or PDF pages into an existing PDF file.',
        page: 'add-pages-to-pdf',
        color: 'from-sky-400 to-cyan-500',
      },
      {
        icon: <CompressIcon className="w-10 h-10" />,
        title: 'Compress PDF',
        description: 'Reduce the file size of your PDF.',
        page: 'compress',
        color: 'from-purple-500 to-violet-600',
      },
      {
        icon: <RotateIcon className="w-10 h-10" />,
        title: 'Rotate PDF',
        description: 'Rotate one or all pages in your PDF.',
        page: 'rotate',
        color: 'from-fuchsia-500 to-pink-600',
      },
      {
        icon: <HashIcon className="w-10 h-10" />,
        title: 'Add Page Numbers',
        description: 'Insert page numbers into your PDF.',
        page: 'add-page-numbers',
        color: 'from-teal-500 to-cyan-600',
      },
      {
        icon: <WatermarkIcon className="w-10 h-10" />,
        title: 'Add Watermark',
        description: 'Add text or image watermark to your PDF.',
        page: 'watermark',
        color: 'from-rose-400 to-red-500',
      },
      {
        icon: <LockIcon className="w-10 h-10" />,
        title: 'Protect PDF',
        description: 'Add a password to protect your PDF.',
        page: 'protect',
        color: 'from-slate-500 to-gray-600',
      },
      {
        icon: <UnlockIcon className="w-10 h-10" />,
        title: 'Unlock PDF',
        description: 'Remove password from your PDF file.',
        page: 'unlock',
        color: 'from-indigo-400 to-purple-500',
      },
      {
        icon: <ImageIcon className="w-10 h-10" />,
        title: 'PNG to PDF',
        description: 'Convert PNG images to PDF with transparency.',
        page: 'png-to-pdf',
        color: 'from-slate-400 to-slate-600',
      },
      {
        icon: <ImageIcon className="w-10 h-10" />,
        title: 'WebP to PDF',
        description: 'Convert modern WebP images to PDF.',
        page: 'webp-to-pdf',
        color: 'from-green-400 to-teal-500',
      },
      {
        icon: <ImageIcon className="w-10 h-10" />,
        title: 'HEIC/HEIF to PDF',
        description: "Convert Apple's HEIC/HEIF photos to PDF.",
        page: 'heic-to-pdf',
        color: 'from-blue-300 to-indigo-400',
      },
      {
        icon: <ImageIcon className="w-10 h-10" />,
        title: 'TIFF to PDF',
        description: 'Convert single or multi-page TIFF files to PDF.',
        page: 'tiff-to-pdf',
        color: 'from-neutral-400 to-neutral-600',
      },
      {
        icon: <ImageIcon className="w-10 h-10" />,
        title: 'GIF to PDF',
        description: 'Convert animated GIFs to a PDF sequence.',
        page: 'gif-to-pdf',
        color: 'from-purple-400 to-pink-500',
      },
      {
        icon: <ImageIcon className="w-10 h-10" />,
        title: 'SVG to PDF',
        description: 'Convert scalable vector graphics to PDF.',
        page: 'svg-to-pdf',
        color: 'from-yellow-400 to-orange-500',
      },
      {
        icon: <ImageIcon className="w-10 h-10" />,
        title: 'BMP to PDF',
        description: 'Convert Bitmap images to PDF.',
        page: 'bmp-to-pdf',
        color: 'from-cyan-400 to-sky-500',
      },
      {
        icon: <BookOpenIcon className="w-10 h-10" />,
        title: 'E-book to PDF',
        description: 'Convert EPUB, MOBI, AZW, FB2 files to PDF.',
        page: 'ebook-to-pdf',
        color: 'from-amber-500 to-orange-600',
      },
    ],
  },
  {
    title: 'Convert Office & Documents to PDF',
    tools: [
      {
        icon: <WordIcon className="w-10 h-10" />,
        title: 'Word to PDF',
        description: 'Convert Word documents to PDF.',
        page: 'word',
        color: 'from-sky-500 to-blue-600',
      },
      {
        icon: <PowerpointIcon className="w-10 h-10" />,
        title: 'PowerPoint to PDF',
        description: 'Convert PowerPoint slides to PDF.',
        page: 'powerpoint',
        color: 'from-orange-500 to-red-600',
      },
      {
        icon: <ExcelIcon className="w-10 h-10" />,
        title: 'Excel to PDF',
        description: 'Convert Excel spreadsheets to PDF.',
        page: 'excel',
        color: 'from-lime-500 to-green-600',
      },
      {
        icon: <FileTextIcon className="w-10 h-10" />,
        title: 'Text to PDF',
        description: 'Convert TXT, RTF, ODT, CSV files to PDF.',
        page: 'text-to-pdf',
        color: 'from-gray-500 to-gray-600',
      },
      {
        icon: <FileTextIcon className="w-10 h-10" />,
        title: 'XPS to PDF',
        description: 'Convert XPS documents to PDF.',
        page: 'xps-to-pdf',
        color: 'from-violet-500 to-purple-600',
      },
      {
        icon: <FileTextIcon className="w-10 h-10" />,
        title: 'OXPS to PDF',
        description: 'Convert OXPS documents to PDF.',
        page: 'oxps-to-pdf',
        color: 'from-fuchsia-500 to-pink-600',
      },
    ],
  },
  {
    title: 'Convert from PDF',
    tools: [
      {
        icon: <WordIcon className="w-10 h-10" />,
        title: 'PDF to Word',
        description: 'Convert PDF to an editable Word document.',
        page: 'pdf-to-word',
        color: 'from-sky-500 to-blue-600',
      },
      {
        icon: <PowerpointIcon className="w-10 h-10" />,
        title: 'PDF to PowerPoint',
        description: 'Convert PDF pages to images for PPT.',
        page: 'pdf-to-powerpoint',
        color: 'from-orange-500 to-red-600',
      },
      {
        icon: <ExcelIcon className="w-10 h-10" />,
        title: 'PDF to Excel',
        description: 'Extract data from PDF tables to CSV.',
        page: 'pdf-to-excel',
        color: 'from-lime-500 to-green-600',
      },
      {
        icon: <FileTextIcon className="w-10 h-10" />,
        title: 'PDF to XPS',
        description: 'Convert PDF files to XPS document format.',
        page: 'pdf-to-xps',
        color: 'from-violet-500 to-purple-600',
      },
    ],
  },
  {
    title: 'Convert Specialized Files to PDF',
    tools: [
      {
        icon: <PaletteIcon className="w-10 h-10" />,
        title: 'Graphics to PDF',
        description: 'Convert AI, PSD, EPS, INDD, and more to PDF.',
        page: 'graphics-to-pdf',
        color: 'from-rose-400 to-fuchsia-500',
      },
      {
        icon: <DraftingCompassIcon className="w-10 h-10" />,
        title: 'CAD to PDF',
        description: 'Convert DWG, DXF, DGN drawings to PDF.',
        page: 'cad-to-pdf',
        color: 'from-indigo-500 to-blue-600',
      },
      {
        icon: <FileTextIcon className="w-10 h-10" />,
        title: 'All Files to PDF',
        description: 'Our universal converter for many file types.',
        page: 'converter',
        color: 'from-blue-500 to-indigo-600',
      },
    ],
  },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState('All Tools');

  const categories = ['All Tools', ...toolCategories.map(c => c.title)];

  const filteredTools = selectedCategory === 'All Tools'
    ? toolCategories.flatMap(category => category.tools)
    : toolCategories.find(category => category.title === selectedCategory)?.tools || [];

  return (
    <div className="w-full text-center">
      <h1 className="text-7xl md:text-9xl font-extrabold mb-4 tracking-tighter">
        <span className="bg-gradient-to-br from-orange-500 to-red-500 bg-clip-text text-transparent">LOLO</span>
        <span className="text-gray-900 dark:text-white">PDF</span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
        One platform, every PDF solution. Use all tools at zero cost. Merge, split, compress, convert, rotate, lock, unlock, and watermark in just moments.
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-brand-primary text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-left">{selectedCategory}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.title}
              {...tool}
              onClick={tool.page ? () => onNavigate(tool.page) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
