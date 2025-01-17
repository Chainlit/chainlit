import { createContext, useContext, useState } from 'react';

interface RAGContextType {
  ragIndex: string;
  setRagIndex: (index: string) => void;
}

const RAGContext = createContext<RAGContextType>({
  ragIndex: '',
  setRagIndex: () => {}
});

export const RAGProvider = ({ children }: { children: React.ReactNode }) => {
  const [ragIndex, setRagIndex] = useState('');

  return (
    <RAGContext.Provider value={{ ragIndex, setRagIndex }}>
      {children}
    </RAGContext.Provider>
  );
};

export const useRAG = () => useContext(RAGContext);
