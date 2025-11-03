import React from 'react';
import { Page } from '../App';
import { CheckIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';

interface PricingPageProps {
  onNavigate: (page: Page, state?: any) => void;
}

const plans = [
    {
        name: 'LOLO Chota',
        price: 2,
        features: [
            '1500+ File Conversions per Month',
            'Standard Processing Speed',
            'All PDF Tools',
            'Email Support'
        ],
        cta: 'Get Started',
        color: 'border-sky-500'
    },
    {
        name: 'LOLO Bara',
        price: 5,
        features: [
            '3500+ File Conversions per Month',
            'Faster Processing Speed',
            'All PDF Tools',
            'Priority Email Support',
        ],
        cta: 'Upgrade Now',
        color: 'border-brand-primary',
        popular: true,
    },
    {
        name: 'LOLO Damaka',
        price: 10,
        features: [
            'Unlimited File Conversions',
            'Highest Priority Processing',
            'All PDF Tools & Beta Features',
            'Dedicated 24/7 Support',
        ],
        cta: 'Go Unlimited',
        color: 'border-amber-500'
    }
];


export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
    const { currentUser } = useAuth();
    
    const handlePurchase = (planName: string, price: number) => {
        if (!currentUser) {
            onNavigate('login');
        } else {
            onNavigate('checkout', { planName, price });
        }
    }

    return (
        <div className="w-full max-w-6xl text-center flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                Choose Your Plan
            </h1>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl">
                Unlock more power with our premium plans. All tools are still available for free with standard limits.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {plans.map(plan => (
                    <div key={plan.name} className={`relative bg-gray-800/50 border-2 ${plan.color} rounded-xl shadow-lg p-8 flex flex-col`}>
                        {plan.popular && <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase">Most Popular</span>}
                        <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                        <p className="text-4xl font-extrabold text-white mb-4">${plan.price}<span className="text-lg font-medium text-gray-400">/mo</span></p>
                        
                        <ul className="space-y-4 text-gray-300 text-left mb-8 flex-grow">
                            {plan.features.map(feature => (
                                <li key={feature} className="flex items-start">
                                    <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0"/>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        
                        <button onClick={() => handlePurchase(plan.name, plan.price)} className={`w-full py-3 font-bold rounded-lg transition-colors ${plan.popular ? 'bg-brand-primary text-white hover:bg-brand-secondary' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                            {plan.cta}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};