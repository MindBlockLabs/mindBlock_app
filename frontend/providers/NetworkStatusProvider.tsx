'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import OfflinePage from '@/components/error/OfflinePage';

interface NetworkStatusContextType {
  isOnline: boolean;
  showOfflinePage: boolean;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = useNetworkStatus();
  const [showOfflinePage, setShowOfflinePage] = useState(false);

  useEffect(() => {
    // Only show offline page if we're definitely offline
    if (!isOnline) {
      setShowOfflinePage(true);
    } else {
      // Delay hiding the offline page to prevent flickering
      const timer = setTimeout(() => {
        setShowOfflinePage(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <NetworkStatusContext.Provider value={{ isOnline, showOfflinePage }}>
      {showOfflinePage ? <OfflinePage /> : children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatusContext = () => {
  const context = useContext(NetworkStatusContext);
  if (context === undefined) {
    throw new Error('useNetworkStatusContext must be used within a NetworkStatusProvider');
  }
  return context;
};