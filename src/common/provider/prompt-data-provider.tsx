"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useState
} from 'react';
import { PromptDataProviderType } from '../types/types';
import { FileAttachmentType } from '../models/schema';

const PrompDataContext = createContext<PromptDataProviderType | null>(null);



export const PromptDataProvider = ({ children }: { children: ReactNode }) => {
  const [prompt, setPrompt] = useState('');
  const [fileData, setFileData] = useState<FileAttachmentType[]>([]);

  const setData = (newPrompt: string, fileData: FileAttachmentType[]) => {
    setPrompt(newPrompt);
    setFileData(fileData);
  };

  const clear = () => {
    setPrompt('');
    setFileData([]);
  };


  return (
    <PrompDataContext.Provider value={{ prompt, fileData, setData, clear }}>
      {children}
    </PrompDataContext.Provider>
  );
};



export const usePromptDataContext = () => {
  const ctx = useContext(PrompDataContext);
  if (!ctx) throw new Error("PrompDataContext must be used within a PromptProvider");
  return ctx;
};
