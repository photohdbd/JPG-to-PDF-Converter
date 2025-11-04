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
import { SignPdfPage } from './pages/SignPdfPage';
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
import { EditPdfPage } from './pages/EditPdfPage';
import { AddPagesToPdfPage } from './pages/AddPagesToPdfPage';
import { AboutUsPage } from './pages/AboutUsPage';

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
  | 'pdf-to-jpg'
  | 'add-page-numbers'
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'pdf-to-powerpoint'
  | 'edit-pdf'
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
  | 'checkout';


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
      case 'sign': return <SignPdfPage onNavigate={navigate} />;
      case 'watermark': return <WatermarkPdfPage onNavigate={navigate} />;
      case 'rotate': return <RotatePdfPage onNavigate={navigate} />;
      case 'protect': return <ProtectPdfPage onNavigate={navigate} />;
      case 'unlock': return <UnlockPdfPage onNavigate={navigate} />;
      case 'edit-pdf': return <EditPdfPage onNavigate={navigate} />;
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