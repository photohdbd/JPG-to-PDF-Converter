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

export const CookiePolicyPage: React.FC<PolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-4xl flex flex-col text-left">
      <BackButton onClick={() => onNavigate('home')} />
      <h1 className="text-4xl font-extrabold text-white mb-8">Cookie Policy</h1>
      <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <PolicySection title="1. What Are Cookies?">
        <p>
          Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
        </p>
      </PolicySection>

      <PolicySection title="2. How We Use Cookies">
        <p>
          LOLOPDF uses cookies for the following purposes:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Essential Cookies:</strong> These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences or filling in forms.
          </li>
          <li>
            <strong>Performance and Analytics Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.
          </li>
          <li>
            <strong>Functionality Cookies:</strong> These cookies enable the website to provide enhanced functionality and personalization. For example, they may be used to remember choices you make to provide a more personalized experience.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="3. Your Choices Regarding Cookies">
        <p>
          You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by setting or amending your web browser controls. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
        </p>
        <p>
          Most web browsers provide help pages relating to cookie management. Please refer to your browser's documentation for more information:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">Apple Safari</a></li>
          <li><a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">Microsoft Edge</a></li>
        </ul>
      </PolicySection>
      
      <PolicySection title="4. Changes to This Cookie Policy">
        <p>
          We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
        </p>
      </PolicySection>
      
      <PolicySection title="5. Contact Us">
        <p>
          If you have any questions about our use of cookies, please contact us via our contact page.
        </p>
      </PolicySection>
    </div>
  );
};