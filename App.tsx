import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ConverterPage } from './pages/ConverterPage';
import { JpgToPdfPage } from './pages/JpgToPdfPage';
import { MergePdfPage } from './pages/MergePdfPage';
import { WordToPdfPage } from './pages/WordToPdfPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

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
      case 'converter': return <ConverterPage />;
      case 'jpg-to-pdf': return <JpgToPdfPage />;
      case 'merge': return <MergePdfPage />;
      
      // Active tools
      case 'word': return <WordToPdfPage />;

      // Coming soon tools
      case 'split': return <PlaceholderPage title="Split PDF" comingSoon />;
      case 'compress': return <PlaceholderPage title="Compress PDF" comingSoon />;
      case 'powerpoint': return <PlaceholderPage title="PowerPoint to PDF" comingSoon />;
      case 'excel': return <PlaceholderPage title="Excel to PDF" comingSoon />;
      case 'sign': return <PlaceholderPage title="Sign PDF" comingSoon />;
      case 'watermark': return <PlaceholderPage title="Add Watermark" comingSoon />;
      case 'rotate': return <PlaceholderPage title="Rotate PDF" comingSoon />;
      case 'protect': return <PlaceholderPage title="Protect PDF" comingSoon />;
      case 'unlock': return <PlaceholderPage title="Unlock PDF" comingSoon />;
      
      // Static/info pages
      case 'all-tools': return <HomePage onNavigate={navigate} />;
      case 'pricing': return <PlaceholderPage title="Pricing Plans" />;
      case 'contact': return <PlaceholderPage title="Contact Us" />;
      case 'login': return <PlaceholderPage title="Login" />;
      case 'signup': return <PlaceholderPage title="Sign Up" />;
      case 'about': return <PlaceholderPage title="About Us" />;
      case 'terms': return <PlaceholderPage title="Terms of Service" />;
      case 'privacy': return <PlaceholderPage title="Privacy Policy" />;
      case 'cookies': return <PlaceholderPage title="Cookie Policy" />;
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