import React from 'react';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { useUsage } from '../contexts/UsageContext';
import { StarIcon, BarChartIcon } from '../components/DashboardIcons';

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
    <div className={`bg-gray-800 p-6 rounded-lg flex items-center gap-4 border-l-4 ${color}`}>
        <div className="text-3xl">{icon}</div>
        <div>
            <div className="text-gray-400 text-sm">{label}</div>
            <div className="text-white text-2xl font-bold">{value}</div>
        </div>
    </div>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
    const { currentUser } = useAuth();
    const { conversions, maxConversions, subscriptionPlan } = useUsage();

    if (!currentUser) {
        // This should ideally be handled by a protected route in App.tsx
        // but as a fallback, we can show a message or redirect.
        return (
            <div className="text-center">
                <p className="text-xl text-white">Please log in to view your dashboard.</p>
                <button onClick={() => onNavigate('login')} className="mt-4 px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg">
                    Go to Login
                </button>
            </div>
        );
    }
    
    const filesConverted = conversions;

    return (
        <div className="w-full max-w-5xl text-white">
            <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="md:col-span-1 bg-gray-800/50 border border-gray-700 p-6 rounded-xl flex flex-col items-center text-center">
                    <img 
                        src={currentUser.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${currentUser.email}`} 
                        alt="Profile" 
                        className="w-28 h-28 rounded-full mb-4 border-4 border-gray-600"
                    />
                    <h2 className="text-xl font-bold">{currentUser.displayName || 'User'}</h2>
                    <p className="text-gray-400 text-sm">{currentUser.email}</p>
                </div>

                {/* Main Content Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
                        <h3 className="text-xl font-semibold mb-4">Account Overview</h3>
                        <div className="space-y-3">
                           <div className="flex items-center gap-3">
                                <StarIcon className="w-5 h-5 text-yellow-400"/>
                                <span>Subscription: <span className="font-bold text-green-400">{subscriptionPlan}</span></span>
                           </div>
                           <p className="text-sm text-gray-400">
                                Upgrade to unlock more features and higher limits.
                           </p>
                           <button onClick={() => onNavigate('pricing')} className="px-5 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-secondary transition-colors text-sm">
                                View Plans
                           </button>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
                        <h3 className="text-xl font-semibold mb-4">Usage Statistics</h3>
                         <div className="flex items-center gap-3 mb-2">
                             <BarChartIcon className="w-5 h-5 text-cyan-400"/>
                             <span>Files Converted This Month</span>
                         </div>
                         <div className="w-full bg-gray-700 rounded-full h-4">
                            <div 
                                className="bg-gradient-to-r from-brand-primary to-brand-secondary h-4 rounded-full" 
                                style={{width: `${(filesConverted / maxConversions) * 100}%`}}
                            ></div>
                         </div>
                         <p className="text-right text-sm mt-2 text-gray-400">{filesConverted} / {maxConversions} conversions</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
