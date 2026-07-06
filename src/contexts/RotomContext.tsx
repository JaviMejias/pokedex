import { createContext, useContext, useState, ReactNode } from 'react';

interface RotomContextValue {
  contextMessage: string;
  setContextMessage: (msg: string) => void;
}

const RotomContext = createContext<RotomContextValue | null>(null);

export function RotomProvider({ children }: { children: ReactNode }) {
  const [contextMessage, setContextMessage] = useState('');
  return (
    <RotomContext.Provider value={{ contextMessage, setContextMessage }}>
      {children}
    </RotomContext.Provider>
  );
}

export function useRotomContext() {
  const context = useContext(RotomContext);
  if (!context) throw new Error('useRotomContext must be used within RotomProvider');
  return context;
}
