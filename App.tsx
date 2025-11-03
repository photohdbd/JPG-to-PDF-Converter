import React, { useState } from 'react';
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
import { SignPdfPage } from './pages/SignPdfPage';
import { WatermarkPdfPage } from './pages/WatermarkPdfPage';
import { RotatePdfPage } from './pages/RotatePdfPage';
import { ProtectPdfPage } from './pages/ProtectPdfPage';
import { UnlockPdfPage } from './pages/UnlockPdfPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';

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
  | 'sign'
  | 'watermark'
  | 'rotate'
  | 'protect'
  | 'unlock'
  | 'all-tools'
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
  | 'github';


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const navigate = (page: Page) => {
    if (page === 'github') {
        window.open('https://github.com/example/ai-pdf-toolkit', '_blank');
        return;
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
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
      case 'sign': return <SignPdfPage onNavigate={navigate} />;
      case 'watermark': return <WatermarkPdfPage onNavigate={navigate} />;
      case 'rotate': return <RotatePdfPage onNavigate={navigate} />;
      case 'protect': return <ProtectPdfPage onNavigate={navigate} />;
      case 'unlock': return <UnlockPdfPage onNavigate={navigate} />;
      
      // Static/info pages
      case 'all-tools': return <HomePage onNavigate={navigate} />;
      case 'pricing': return <PlaceholderPage title="Pricing Plans" />;
      case 'contact': return <PlaceholderPage title="Contact Us" />;
      case 'login': return <PlaceholderPage title="Login" />;
      case 'signup': return <PlaceholderPage title="Sign Up" />;
      case 'about': return <PlaceholderPage title="About Us" />;
      case 'terms': return <TermsOfServicePage onNavigate={navigate} />;
      case 'privacy': return <PrivacyPolicyPage onNavigate={navigate} />;
      case 'cookies': return <CookiePolicyPage onNavigate={navigate} />;
      case 'help': return <PlaceholderPage title="Help Center" />;
      case 'api_docs': return <PlaceholderPage title="API Docs" />;

      case 'home':
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 font-sans">
      <Header onNavigate={navigate} />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
        {renderContent()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
};

export default App;
