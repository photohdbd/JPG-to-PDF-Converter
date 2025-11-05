import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ConverterPage } from './pages/ConverterPage';
import { JpgToPdfPage } from './pages/JpgToPdfPage';
import { MergePdfPage } from './pages/MergePdfPage';
import { WordToPdfPage } from './pages/WordToPdfPage';
import { SplitPdfPage } from './pages/SplitPdfPage';
import { CompressPdfPage } from './pages/CompressPdfPage';
import { PowerpointToPdfPage } from './pages/PowerpointToPdfPage';
import { ExcelToPdfPage } from './pages/ExcelToPdfPage';
import { WatermarkPdfPage } from './pages/WatermarkPdfPage';
import { RotatePdfPage } from './pages/RotatePdfPage';
import { ProtectPdfPage } from './pages/ProtectPdfPage';
import { UnlockPdfPage } from './pages/UnlockPdfPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { PdfToJpgPage } from './pages/PdfToJpgPage';
import { AddPageNumbersPage } from './pages/AddPageNumbersPage';
import { PdfToWordPage } from './pages/PdfToWordPage';
import { PdfToExcelPage } from './pages/PdfToExcelPage';
import { PdfToPowerpointPage } from './pages/PdfToPowerpointPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { PricingPage } from './pages/PricingPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { useAuth } from './contexts/AuthContext';
import { AddPagesToPdfPage } from './pages/AddPagesToPdfPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { GenericToPdfPage } from './pages/GenericToPdfPage';
import { XpsToPdfPage } from './pages/XpsToPdfPage';
import { OxpsToPdfPage } from './pages/OxpsToPdfPage';
import { PdfToXpsPage } from './pages/PdfToXpsPage';

export type Page =
  | 'home'
  | 'converter'
  | 'jpg-to-pdf'
  | 'merge'
  | 'split'
  | 'compress'
  | 'word'
  | 'powerpoint'
  | 'excel'
  | 'watermark'
  | 'rotate'
  | 'protect'
  | 'unlock'
  | 'pdf-to-jpg'
  | 'add-page-numbers'
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'pdf-to-powerpoint'
  | 'add-pages-to-pdf'
  | 'pricing'
  | 'contact'
  | 'login'
  | 'signup'
  | 'about'
  | 'terms'
  | 'privacy'
  | 'cookies'
  | 'help'
  | 'api_docs'
  | 'github'
  | 'dashboard'
  | 'checkout'
  // New Pages
  | 'png-to-pdf'
  | 'webp-to-pdf'
  | 'bmp-to-pdf'
  | 'tiff-to-pdf'
  | 'heic-to-pdf'
  | 'gif-to-pdf'
  | 'svg-to-pdf'
  | 'text-to-pdf'
  | 'ebook-to-pdf'
  | 'cad-to-pdf'
  | 'graphics-to-pdf'
  | 'xps-to-pdf'
  | 'oxps-to-pdf'
  | 'pdf-to-xps';


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageState, setPageState] = useState<any>(null);
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const navigate = (page: Page, state: any = null) => {
    if (page === 'github') {
        window.open('https://github.com/example/lolopdf-toolkit', '_blank');
        return;
    }
    setCurrentPage(page);
    setPageState(state);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    // Protected Routes
    if (currentPage === 'dashboard' && !currentUser) {
       return <LoginPage onNavigate={navigate} />;
    }
     if (currentPage === 'checkout' && !currentUser) {
       return <LoginPage onNavigate={navigate} />;
    }


    switch (currentPage) {
      case 'converter': return <ConverterPage onNavigate={navigate} />;
      case 'jpg-to-pdf': return <JpgToPdfPage onNavigate={navigate} />;
      case 'merge': return <MergePdfPage onNavigate={navigate} />;
      case 'split': return <SplitPdfPage onNavigate={navigate} />;
      case 'compress': return <CompressPdfPage onNavigate={navigate} />;
      
      // Active tools
      case 'word': return <WordToPdfPage onNavigate={navigate} />;
      case 'powerpoint': return <PowerpointToPdfPage onNavigate={navigate} />;
      case 'excel': return <ExcelToPdfPage onNavigate={navigate} />;
      case 'watermark': return <WatermarkPdfPage onNavigate={navigate} />;
      case 'rotate': return <RotatePdfPage onNavigate={navigate} />;
      case 'protect': return <ProtectPdfPage onNavigate={navigate} />;
      case 'unlock': return <UnlockPdfPage onNavigate={navigate} />;
      case 'add-pages-to-pdf': return <AddPagesToPdfPage onNavigate={navigate} />;

      // New Tools
      case 'pdf-to-jpg': return <PdfToJpgPage onNavigate={navigate} />;
      case 'add-page-numbers': return <AddPageNumbersPage onNavigate={navigate} />;
      case 'pdf-to-word': return <PdfToWordPage onNavigate={navigate} />;
      case 'pdf-to-excel': return <PdfToExcelPage onNavigate={navigate} />;
      case 'pdf-to-powerpoint': return <PdfToPowerpointPage onNavigate={navigate} />;
      
      // App pages
      case 'pricing': return <PricingPage onNavigate={navigate} />;
      case 'login': return <LoginPage onNavigate={navigate} />;
      case 'signup': return <SignupPage onNavigate={navigate} />;
      case 'dashboard': return <DashboardPage onNavigate={navigate} />;
      case 'checkout': return <CheckoutPage onNavigate={navigate} {...pageState} />;

      // Static/info pages
      case 'contact': return <PlaceholderPage title="Contact Us" />;
      case 'about': return <AboutUsPage onNavigate={navigate} />;
      case 'terms': return <TermsOfServicePage onNavigate={navigate} />;
      case 'privacy': return <PrivacyPolicyPage onNavigate={navigate} />;
      case 'cookies': return <CookiePolicyPage onNavigate={navigate} />;
      case 'help': return <PlaceholderPage title="Help Center" />;
      case 'api_docs': return <PlaceholderPage title="API Docs" />;

      // New Generic Converters
      case 'png-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="PNG to PDF Converter" pageDescription="Convert PNG images to a single, high-quality PDF document." fileUploadTitle="Drag & Drop Your PNG Files Here" acceptedMimeTypes="image/png" fileTypeDescription="Supports .png files" />;
      case 'webp-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="WebP to PDF Converter" pageDescription="Convert modern WebP images to PDF files, perfect for web content." fileUploadTitle="Drag & Drop Your WebP Files Here" acceptedMimeTypes="image/webp" fileTypeDescription="Supports .webp files" />;
      case 'bmp-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="BMP to PDF Converter" pageDescription="Convert Bitmap images into universally compatible PDF files." fileUploadTitle="Drag & Drop Your BMP Files Here" acceptedMimeTypes="image/bmp" fileTypeDescription="Supports .bmp files" />;
      case 'tiff-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="TIFF to PDF Converter" pageDescription="Convert single or multi-page TIFF images into a single PDF." fileUploadTitle="Drag & Drop Your TIFF Files Here" acceptedMimeTypes="image/tiff" fileTypeDescription="Supports .tiff and .tif files" />;
      case 'heic-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="HEIC/HEIF to PDF Converter" pageDescription="Convert Apple's high-efficiency HEIC/HEIF photos to PDF." fileUploadTitle="Drag & Drop Your HEIC/HEIF Files Here" acceptedMimeTypes="image/heic,image/heif,.heic,.heif" fileTypeDescription="Supports .heic and .heif files" />;
      case 'gif-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="GIF to PDF Converter" pageDescription="Convert animated GIFs to a multi-page PDF, one frame per page." fileUploadTitle="Drag & Drop Your GIF Files Here" acceptedMimeTypes="image/gif" fileTypeDescription="Supports .gif files" />;
      case 'svg-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="SVG to PDF Converter" pageDescription="Convert scalable vector graphics (SVG) to high-resolution PDFs." fileUploadTitle="Drag & Drop Your SVG Files Here" acceptedMimeTypes="image/svg+xml" fileTypeDescription="Supports .svg files" />;
      case 'text-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="Text File to PDF Converter" pageDescription="Convert various text documents (TXT, RTF, ODT, CSV) to PDF." fileUploadTitle="Drag & Drop Your Text Files Here" acceptedMimeTypes=".txt,.rtf,.odt,.csv" fileTypeDescription="Supports TXT, RTF, ODT, CSV and more" />;
      case 'ebook-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="E-book to PDF Converter" pageDescription="Convert e-book files (EPUB, MOBI, AZW, FB2) to PDF for easy reading." fileUploadTitle="Drag & Drop Your E-book Files Here" acceptedMimeTypes=".epub,.mobi,.azw,.fb2,application/epub+zip" fileTypeDescription="Supports EPUB, MOBI, AZW, FB2 files" />;
      case 'cad-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="CAD to PDF Converter" pageDescription="Convert CAD drawings (DWG, DXF, DGN) to PDF for easy sharing and viewing." fileUploadTitle="Drag & Drop Your CAD Files Here" acceptedMimeTypes=".dwg,.dxf,.dgn,image/vnd.dwg,image/vnd.dxf" fileTypeDescription="Supports DWG, DXF, DGN files" />;
      case 'graphics-to-pdf': return <GenericToPdfPage onNavigate={navigate} pageTitle="Graphics & Design to PDF Converter" pageDescription="Convert design files (AI, PSD, EPS, INDD) into shareable PDFs." fileUploadTitle="Drag & Drop Your Design Files Here" acceptedMimeTypes=".ai,.psd,.eps,.indd,application/postscript,image/vnd.adobe.photoshop" fileTypeDescription="Supports AI, PSD, EPS, INDD files" />;
      case 'xps-to-pdf': return <XpsToPdfPage onNavigate={navigate} />;
      case 'oxps-to-pdf': return <OxpsToPdfPage onNavigate={navigate} />;
      case 'pdf-to-xps': return <PdfToXpsPage onNavigate={navigate} />;

      case 'home':
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <Header onNavigate={navigate} theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
        {renderContent()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
};

export default App;
