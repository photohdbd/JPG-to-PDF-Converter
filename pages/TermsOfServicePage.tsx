import React from 'react';
import { Page } from '../App';
import { BackButton } from '../components/BackButton';

interface PolicyPageProps {
    onNavigate: (page: Page) => void;
}

const PolicySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
        <div className="space-y-4 text-gray-300">{children}</div>
    </div>
);

export const TermsOfServicePage: React.FC<PolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-4xl flex flex-col text-left">
      <BackButton onClick={() => onNavigate('home')} />
      <h1 className="text-4xl font-extrabold text-white mb-8">Terms of Service</h1>
      <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <PolicySection title="1. Acceptance of Terms">
        <p>
          By accessing or using the LOLOPDF website and services ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use our Service.
        </p>
      </PolicySection>

      <PolicySection title="2. Description of Service">
        <p>
          LOLOPDF provides a suite of online tools for converting, merging, splitting, compressing, and otherwise manipulating PDF files. Some features may be enhanced by artificial intelligence. The Service is provided "as is" and we reserve the right to modify or discontinue it at any time without notice.
        </p>
      </PolicySection>

      <PolicySection title="3. User Conduct and Content">
        <p>
          You are solely responsible for the files and content you upload, process, and download through our Service ("User Content"). You agree not to use the Service to process any content that:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Is unlawful, harmful, threatening, or otherwise objectionable.</li>
          <li>Infringes upon any third party's intellectual property rights, including copyrights, patents, trademarks, or trade secrets.</li>
          <li>Contains software viruses or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware.</li>
          <li>Violates any applicable local, state, national, or international law.</li>
        </ul>
        <p>
          We do not claim ownership of your User Content. All files you upload are processed automatically and are permanently deleted from our servers within a reasonable timeframe (typically 24 hours) after processing. We do not view, access, or store your files for any purpose other than providing the Service.
        </p>
      </PolicySection>

      <PolicySection title="4. Disclaimer of Warranties">
        <p>
          The Service is provided on an "as is" and "as available" basis. LOLOPDF expressly disclaims all warranties of any kind, whether express or implied, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We make no warranty that the Service will meet your requirements, be uninterrupted, timely, secure, or error-free.
        </p>
      </PolicySection>
      
      <PolicySection title="5. Limitation of Liability">
        <p>
          You expressly understand and agree that LOLOPDF shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data, or other intangible losses (even if we have been advised of the possibility of such damages), resulting from the use or the inability to use the Service.
        </p>
      </PolicySection>

      <PolicySection title="6. Changes to the Terms">
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
        </p>
      </PolicySection>

      <PolicySection title="7. Contact Us">
        <p>
          If you have any questions about these Terms, please contact us through our contact page.
        </p>
      </PolicySection>
    </div>
  );
};