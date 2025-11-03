import React, { useState } from 'react';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { LockIcon } from '../components/Icons';

interface CheckoutPageProps {
  onNavigate: (page: Page) => void;
  planName: string;
  price: number;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate, planName, price }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder for payment processing logic
    console.log("Processing payment for", planName);
    setTimeout(() => {
        alert("Thank you for your purchase! (This is a demo)");
        onNavigate('dashboard');
        setLoading(false);
    }, 2000);
  }

  return (
    <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Complete Your Purchase</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-gray-800/50 border border-gray-700 p-8 rounded-xl h-fit">
                <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-3">Order Summary</h2>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Plan:</span>
                        <span className="font-bold">{planName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Billed:</span>
                        <span className="font-bold">Monthly</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-600 pt-3 mt-3">
                        <span>Total Due Today:</span>
                        <span>${price.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Payment Form */}
            <div className="bg-gray-800 border border-gray-700 p-8 rounded-xl">
                 <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
                 <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400">Email</label>
                            <input type="email" value={currentUser?.email || ''} readOnly className="w-full p-3 bg-gray-700 rounded mt-1 cursor-not-allowed"/>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Cardholder Name</label>
                            <input type="text" placeholder="John Doe" required className="w-full p-3 bg-gray-700 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                        </div>
                         <div>
                            <label className="text-sm text-gray-400">Card Information</label>
                            <div className="w-full p-3 bg-gray-700 rounded mt-1">
                                {/* Placeholder for a Stripe Card Element or similar */}
                                Card Number | MM/YY | CVC
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full mt-6 bg-brand-primary font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-secondary transition-colors disabled:bg-gray-600">
                        <LockIcon className="w-5 h-5"/>
                        {loading ? 'Processing...' : `Pay $${price.toFixed(2)}`}
                    </button>
                 </form>
            </div>
        </div>
    </div>
  );
};