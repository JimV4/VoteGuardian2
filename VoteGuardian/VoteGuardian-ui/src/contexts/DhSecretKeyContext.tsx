import React, { createContext, useContext, useState } from 'react';

type DhSecretKeyContextType = {
  secretKey: string | null;
  setSecretKey: (key: string) => void;
  clearSecretKey: () => void;
};

const DhSecretKeyContext = createContext<DhSecretKeyContextType | undefined>(undefined);

export const DhSecretKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [secretKey, setSecretKeyState] = useState<string | null>(null);

  const setSecretKey = (key: string): void => {
    setSecretKeyState(key);
  };
  const clearSecretKey = (): void => {
    setSecretKeyState(null);
  };

  return (
    <DhSecretKeyContext.Provider value={{ secretKey, setSecretKey, clearSecretKey }}>
      {children}
    </DhSecretKeyContext.Provider>
  );
};

export const useDhSecretKey = (): DhSecretKeyContextType => {
  const context = useContext(DhSecretKeyContext);
  if (!context) {
    throw new Error('useDhSecretKey must be used within a DhSecretKeyProvider');
  }
  return context;
};
