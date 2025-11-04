import React from 'react';
import { Page } from '../App';
import { BackButton } from '../components/BackButton';

interface AboutUsPageProps {
    onNavigate: (page: Page) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
        <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
    </div>
);

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-4xl flex flex-col text-left">
      <BackButton onClick={() => onNavigate('home')} />
      <div className="flex items-center gap-4 mb-8">
         <img src="/favicon.svg" alt="LOLOPDF Logo" className="w-16 h-16" />
         <h1 className="text-4xl font-extrabold text-white">About LOLOPDF</h1>
      </div>
     

      <Section title="Our Mission">
        <p>
          At LOLOPDF, our mission is to simplify document management for everyone. We believe that powerful tools for handling PDFs should be accessible, intuitive, and secure. We started with a simple idea: create a comprehensive, one-stop solution for all PDF-related tasks, removing the frustration and complexity often associated with document workflows.
        </p>
      </Section>

      <Section title="What We Do">
        <p>
          LOLOPDF is a complete suite of online tools designed to make your life easier. From converting images and documents to PDF, to organizing your files by merging, splitting, and compressing, we've got you covered. Our toolkit is constantly expanding to meet the evolving needs of our users. We offer:
        </p>
        <ul className="list-disc list-inside space-y-2 pl-4">
          <li><strong>Effortless Conversion:</strong> Seamlessly convert various file formats like JPG, Word, PowerPoint, and Excel to and from PDF while maintaining quality.</li>
          <li><strong>Powerful Organization:</strong> Merge multiple documents, split large files into smaller ones, compress PDFs to save space, and rotate pages to the correct orientation.</li>
          <li><strong>Secure Editing:</strong> Add watermarks, protect your files with passwords, or remove restrictions from your documents with ease.</li>
        </ul>
      </Section>

      <Section title="Our Commitment to Privacy & Security">
        <p>
          Your privacy is our top priority. We understand the sensitive nature of the documents you handle, which is why we've built our platform with security at its core. 
        </p>
         <p>
          Most operations are performed directly in your browser, meaning your files often don't even leave your computer. For any processes that require server-side handling, we use end-to-end encryption. More importantly, we have a strict policy of automatically deleting all uploaded files from our servers within a few hours. We don't look at your files, we don't store them, and we certainly don't share them. Your documents are yours and yours alone.
        </p>
      </Section>
      
      <Section title="Why LOLOPDF?">
        <p>
          We are dedicated to providing a user-friendly experience without compromising on functionality. Our tools are designed to be fast, reliable, and available on any device with a web browser. Whether you're a student, a professional, or just someone who needs to manage documents occasionally, LOLOPDF is here to help you get the job done quickly and efficiently.
        </p>
      </Section>
    </div>
  );
};
