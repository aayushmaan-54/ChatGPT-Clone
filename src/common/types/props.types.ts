import { FileAttachmentType } from "../models/schema";
import { UploadedFile } from "./types";



export interface FileItemProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
}


export interface PromptInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}


export interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}


export interface SavePromptDataProps {
  conversationId: string;
  prompt: string;
  files: FileAttachmentType[];
  previousPromptId?: string | null;
}


export interface ChatPageClientProps {
  conversationId: string;
}

export interface PromptFileItemProps {
  fileData: FileAttachmentType;
}
