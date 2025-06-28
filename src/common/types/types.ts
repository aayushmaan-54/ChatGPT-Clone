/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AiResponseType,
  FileAttachmentType,
  MessageType,
  PromptType,
  ConversationType,
} from '../models/schema';
import { type Message as VercelAIMessageBase } from 'ai';

export type ClientConversationType = Omit<ConversationType, 'lastActiveAt' | 'createdAt' | 'updatedAt' | 'messageId'> & {
    conversationTitle: string;
    lastActiveAt: string;
    createdAt: string;
    updatedAt: string;
    messageId: string[];
};

export type AIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};


export interface FormattedResponseForClient {
  _id: string;
  aiResponse: string;
  responseVersion: number;
  aiModel: string;
  feedback: "positive" | "negative" | "neutral";
  createdAt: Date;
}


export interface UploadedFile {
  id: string;
  file: File;
  filePreview?: string;
  uploadProgress?: number;
  isUploading?: boolean;
  publicId?: string;
  url?: string;
  error?: string;
  mimeType?: string;
  filename?: string;
  size?: number;
}


export type PromptDataProviderType = {
  prompt: string;
  fileData: FileAttachmentType[];
  setData: (prompt: string, fileUrls: FileAttachmentType[]) => void;
  clear: () => void;
};


export type AllPopulatedMessage = Omit<MessageType, 'promptId' | 'aiResponseId'> & {
  promptId: PromptType[];
  aiResponseId: AiResponseType[];
};


export type AISDKFileData = string | Uint8Array | Buffer | ArrayBuffer | URL;

type VercelAIFilePart = {
  type: 'file';
  data: AISDKFileData;
  mimeType: string;
};

type VercelAITextPart = {
  type: 'text';
  text: string;
};

export type VercelAIContentPart = VercelAITextPart | VercelAIFilePart;

export type VercelAIMessage = Omit<VercelAIMessageBase, 'content'> & {
  content: string | VercelAIContentPart[];
  data?: Record<string, any>;
};


export type PromptChainItem = PromptType & {
  responses: AiResponseType[];
  fileAttachments?: FileAttachmentType[];
};


export type MessageGroup = {
  messageChain: VercelAIMessage[];
};
