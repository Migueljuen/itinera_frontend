import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const triggerProfileUpdate = () => {
    setProfileUpdated(prev => !prev); // Toggle this value to trigger updates
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