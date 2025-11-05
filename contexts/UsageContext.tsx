import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface UsageContextType {
  conversions: number;
  incrementConversions: (count?: number) => void;
  maxConversions: number;
  subscriptionPlan: string;
}

const UsageContext = createContext<UsageContextType>({
  conversions: 0,
  incrementConversions: () => {},
  maxConversions: 500, // Default for Free Plan
  subscriptionPlan: 'Free Plan',
});

export const useUsage = () => useContext(UsageContext);

export const UsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [conversions, setConversions] = useState(0);
  
  // In a real app, this would come from user's subscription data from a backend
  const [maxConversions, setMaxConversions] = useState(500);
  const [subscriptionPlan, setSubscriptionPlan] = useState('Free Plan');

  const getStorageKey = useCallback(() => {
    return currentUser ? `usage_stats_${currentUser.uid}` : 'usage_stats_guest';
  }, [currentUser]);

  useEffect(() => {
    const key = getStorageKey();
    try {
      const storedStats = localStorage.getItem(key);
      if (storedStats) {
        setConversions(JSON.parse(storedStats).conversions || 0);
      } else {
        setConversions(0); // Reset for new user or guest session
      }
    } catch (error) {
      console.error("Failed to parse usage stats from localStorage", error);
      setConversions(0);
    }
    // This is where you would fetch subscription details from a backend.
    // For this demo, we'll keep it static.
  }, [getStorageKey]);

  const incrementConversions = useCallback((count = 1) => {
    setConversions(prev => {
      const newCount = prev + count;
      try {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify({ conversions: newCount }));
      } catch (error) {
        console.error("Failed to save usage stats to localStorage", error);
      }
      return newCount;
    });
  }, [getStorageKey]);

  const value = {
    conversions,
    incrementConversions,
    maxConversions,
    subscriptionPlan,
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
};
