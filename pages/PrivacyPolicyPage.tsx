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

export const PrivacyPolicyPage: React.FC<PolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-4xl flex flex-col text-left">
      <BackButton onClick={() => onNavigate('home')} />
      <h1 className="text-4xl font-extrabold text-white mb-8">Privacy Policy</h1>
      <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <PolicySection title="1. Introduction">
        <p>
          Welcome to AI PDF Toolkit ("we", "our", "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (collectively, the "Service").
        </p>
      </PolicySection>

      <PolicySection title="2. Information We Collect">
        <h3 className="text-xl font-semibold text-gray-100 mb-2">Files You Upload</h3>
        <p>
          When you use our Service, you may upload documents and files ("User Content"). We process this User Content solely to perform the requested action (e.g., converting, merging). We have a strict policy regarding your files:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>We do not access, view, or analyze your files manually. All processing is automated.</li>
          <li>We do not store your files permanently. All uploaded and processed files are automatically and irrevocably deleted from our servers within 24 hours.</li>
          <li>We do not share your files with any third parties.</li>
        </ul>
        <h3 className="text-xl font-semibold text-gray-100 mt-4 mb-2">Usage Data</h3>
        <p>
          We may collect anonymous information about your use of the Service, such as the tools you use, the number of files processed, and general usage patterns. This data is aggregated and anonymized and does not contain any personal information. We use this data to improve our Service's performance and user experience.
        </p>
      </PolicySection>

      <PolicySection title="3. How We Use Your Information">
        <p>
          We use the information we collect in the following ways:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>To provide, operate, and maintain our Service:</strong> This includes processing your files to perform the conversions or modifications you request.</li>
          <li><strong>To improve, personalize, and expand our Service:</strong> Analyzing anonymous usage data helps us understand which features are popular and how we can make our tools better.</li>
          <li><strong>To ensure security:</strong> We monitor for security purposes and to prevent fraudulent or illegal activities.</li>
        </ul>
      </PolicySection>

      <PolicySection title="4. Data Security">
        <p>
          We implement a variety of security measures to maintain the safety of your information. All data transfer between your browser and our servers is encrypted using Secure Socket Layer (SSL) technology. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
        </p>
      </PolicySection>

      <PolicySection title="5. Cookies">
        <p>
          We use cookies to enhance your experience on our site. For more detailed information about the cookies we use, please refer to our <button onClick={() => onNavigate('cookies')} className="text-brand-secondary hover:underline">Cookie Policy</button>.
        </p>
      </PolicySection>

      <PolicySection title="6. Children's Privacy">
        <p>
          Our Service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
        </p>
      </PolicySection>

      <PolicySection title="7. Changes to This Privacy Policy">
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
        </p>
      </PolicySection>

      <PolicySection title="8. Contact Us">
        <p>
          If you have any questions about this Privacy Policy, please contact us via our contact page.
        </p>
      </PolicySection>
    </div>
  );
};
