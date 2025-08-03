import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

// Define a type for your context value
interface RefreshContextType {
  isRefreshing: boolean;
  refreshData: () => Promise<void>;
  profileUpdated: boolean;
  triggerProfileUpdate: () => void;
}

// Create context with proper type and default value
const RefreshContext = createContext<RefreshContextType | null>(null);

// Define props type for the provider
interface RefreshProviderProps {
  children: ReactNode;
}

export const RefreshProvider = ({ children }: RefreshProviderProps) => {
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerProfileUpdate = useCallback(() => {
    setProfileUpdated(prev => !prev);
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  return (
    <RefreshContext.Provider value={{
      isRefreshing,
      refreshData,
      profileUpdated,
      triggerProfileUpdate
    }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = (): RefreshContextType => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

// Add a default export dummy component to satisfy Expo Router
export default function RefreshContextComponent() {
  // This component should never be rendered directly
  return null;
}