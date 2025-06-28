/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo
} from "react";
import { useChat } from '@ai-sdk/react';
import toast from "react-hot-toast";
import {
  AiResponseVersionType,
  PromptType,
  FileAttachmentType
} from "~/common/models/schema";
import {
  MessageGroup,
  VercelAIMessage,
  UploadedFile,
  VercelAIContentPart
} from "~/common/types/types";
import { usePromptDataContext } from "~/common/provider/prompt-data-provider";
import {
  ChatModelId,
  DEFAULT_CHAT_MODEL,
  chatModels
} from "~/common/data/chat-model";
import { useConversationStore } from "~/common/store/conversation-store";
import savePromptData from "~/app/actions/save-prompt-data";
import updateFeedback from "~/app/actions/update-feedback";
import handleErrorClient from "~/common/utils/handle-error-client";
import devLogger from "~/common/utils/dev-logger";
import {
  ArrowDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ThumbsDown,
  ThumbsUp
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
import PromptInput from "~/common/components/prompt-input/prompt-input";
import PromptFileItem from "./prompt-file-item";

type MessageVersionState = {
  versions: AiResponseVersionType[];
  currentVersionIndex: number;
  isGenerating: boolean;
  streamingContent: string | null;
  feedback: 'GOOD' | 'BAD' | null;
  feedbackLoading: boolean;
  aiResponseId: string;
};



export default function ChatPageClient({ conversationId, initialMessages = [] }: { conversationId: string, initialMessages?: MessageGroup[] }) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [promptData, setPromptData] = useState<PromptType | null>(null);
  const [aiModel] = useState<ChatModelId>(DEFAULT_CHAT_MODEL);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageVersionState, setMessageVersionState] = useState<Record<string, MessageVersionState>>({});
  const [isSubmittingFromHome, setIsSubmittingFromHome] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const { addOrUpdateConversation } = useConversationStore();

  const aiResponseIdRef = useRef<string | null>(null); // AI response id
  const pendingPromptDataRef = useRef<PromptType | null>(null); // Pending prompt data
  const messagesEndRef = useRef<HTMLDivElement>(null); // Messages end ref
  const fileInputRef = useRef<HTMLInputElement>(null); // File input ref
  const scrollAreaRef = useRef<HTMLDivElement>(null); // Scroll area ref
  const atBottomRef = useRef(true); // At bottom ref

  // Context Hooks
  const { prompt: promptFromHome, clear } = usePromptDataContext();

  // Prepare initial messages for useChat hook
  const flattenedMessages: VercelAIMessage[] = initialMessages.flatMap(group =>
    group.messageChain.map(item => ({
      id: item.id,
      role: item.role,
      content: item.content,
      data: item.data,
    }))
  );

  // Main Vercel AI SDK Hook
  const {
    messages, // Messages
    input, // Input
    isLoading: streamIsLoading, // Stream is loading
    setMessages, // Set messages
    append, // Append
    setInput, // Set input
  } = useChat({
    initialMessages: flattenedMessages as any,
    api: '/api/stream/response',
    streamProtocol: 'data',
    body: {
      promptId: promptData?._id,
      aiModel,
      conversationId
    },
    onResponse: (response) => {
      const aiResponseId = response.headers.get('X-Ai-Response-Id');
      if (aiResponseId) aiResponseIdRef.current = aiResponseId;
    },
    onFinish: (message) => {
      if (message.role === 'assistant' && aiResponseIdRef.current) {
        const realId = aiResponseIdRef.current;
        const tempId = message.id;

        const newVersion: AiResponseVersionType = { responseText: message.content, aiModel, createdAt: new Date() };

        setMessageVersionState(prev => ({
          ...prev,
          [realId]: {
            versions: [newVersion],
            currentVersionIndex: 0,
            isGenerating: false,
            streamingContent: null,
            feedback: null,
            feedbackLoading: false,
            aiResponseId: realId,
          }
        }));

        setMessages(prevMessages => prevMessages.map(m =>
          m.id === tempId ? { ...m, id: realId } : m
        ));

        aiResponseIdRef.current = null;
      }
      if (pendingPromptDataRef.current) {
        setPromptData(pendingPromptDataRef.current);
        pendingPromptDataRef.current = null;
      }
    },
    onError: (error) => {
      handleErrorClient(error);
      toast.error('An error occurred');
    }
  });


  // Submission Handler
  const onPromptSubmit = useCallback(
    async (promptText: string) => {
      if (!promptText.trim() && uploadedFiles.length === 0) {
        return;
      }

      // Check if all files are fully uploaded
      const hasUnfinishedUploads = uploadedFiles.some(f => f.isUploading || !f.url || f.error);

      // If there are unfinished uploads, show toast and return
      if (hasUnfinishedUploads) {
        uploadedFiles.forEach((f, i) => {
          console.log(`File ${i}:`, {
            isUploading: f.isUploading,
            hasUrl: !!f.url,
            hasError: !!f.error,
            filename: f.filename
          });
        });
        toast.error('Please wait for all files to finish uploading before submitting.');
        return;
      }

      // Convert uploaded files to file attachment type
      const filesToSave: FileAttachmentType[] = uploadedFiles
        .map(f => {
          if (f.url && f.filename && f.size && f.mimeType && !f.isUploading && !f.error) {
            return {
              cloudinaryUrl: f.url,
              fileName: f.filename,
              fileSize: f.size,
              mimeType: f.mimeType
            };
          }
          return null;
        })
        .filter((f): f is FileAttachmentType => f !== null);

      try {
        // Save prompt data
        const saveDataResponse = await savePromptData({
          conversationId,
          prompt: promptText,
          files: filesToSave,
          previousPromptId: promptData?._id?.toString() || null,
        });

        // Get new prompt data and updated conversation
        const newPromptData = saveDataResponse.prompt;
        const updatedConversation = saveDataResponse.conversation;

        // If conversation is updated, add or update it
        if (updatedConversation) {
          addOrUpdateConversation(updatedConversation as any);
        }

        // Set pending prompt data
        pendingPromptDataRef.current = newPromptData;

        // Create user message content
        const userMessageContent: VercelAIContentPart[] = [
          { type: 'text', text: promptText },
        ];

        // If there are file attachments, add them to the user message content
        if (newPromptData.fileAttachments && newPromptData.fileAttachments.length > 0) {
          newPromptData.fileAttachments.forEach((file: FileAttachmentType) => {
            if (file.mimeType.startsWith('image/')) {
              (userMessageContent as any[]).push({
                type: 'image',
                image: file.cloudinaryUrl,
              });
            }
          });
        }

        // Convert file attachments to plain object
        const plainFileData = newPromptData.fileAttachments.map((f: FileAttachmentType) => {
          return {
            fileName: f.fileName,
            fileSize: f.fileSize,
            cloudinaryUrl: f.cloudinaryUrl,
            mimeType: f.mimeType,
          }
        });

        // Create new message
        const newMessage: VercelAIMessage = {
          id: newPromptData._id.toString(),
          role: 'user',
          content: userMessageContent,
          data: {
            fileData: plainFileData,
          },
        };

        // Append new message
        append(newMessage as any, {
          body: { promptId: newPromptData._id, aiModel, conversationId },
          data: {
            fileData: plainFileData,
          },
        });

        setInput('');
        setUploadedFiles([]);
        clear();
      } catch (error) {
        handleErrorClient(error);
      }
    },
    [
      conversationId,
      uploadedFiles,
      promptData,
      aiModel,
      append,
      clear,
      setInput,
      addOrUpdateConversation,
    ],
  );

  // Handle prompt from home(/)
  useEffect(() => {
    if (promptFromHome && initialMessages.length === 0) {
      setInput(promptFromHome);
      setIsSubmittingFromHome(true);
      clear();
    }
  }, [promptFromHome, initialMessages, setInput, clear]);


  // Handle prompt from home(/)
  useEffect(() => {
    if (isSubmittingFromHome && input) {
      onPromptSubmit(input);
      setIsSubmittingFromHome(false);
    }
  }, [isSubmittingFromHome, input, onPromptSubmit]);


  // Handle initial messages
  useEffect(() => {
    const initialState: Record<string, MessageVersionState> = {};
    initialMessages.forEach(group => {
      if (group.messageChain.length > 1 && group.messageChain[1].role === 'assistant') {
        const assistantMessage = group.messageChain[1];
        if (assistantMessage.data?.aiResponseId) {
          initialState[assistantMessage.id] = {
            versions: assistantMessage.data.versions,
            currentVersionIndex: assistantMessage.data.currentVersionIndex,
            isGenerating: false,
            streamingContent: null,
            feedback: null,
            feedbackLoading: false,
            aiResponseId: assistantMessage.data.aiResponseId,
          };
        }
      }
    });
    setMessageVersionState(initialState);
  }, [initialMessages]);


  // Handle copy message
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      devLogger.error('Failed to copy message:', err);
      toast.error('Failed to copy prompt');
    }
  };

  // Handle feedback
  const handleFeedback = async (messageId: string, feedback: 'GOOD' | 'BAD') => {
    const versionState = messageVersionState[messageId];
    if (!versionState) return;
    setMessageVersionState(prev => ({ ...prev, [messageId]: { ...versionState, feedbackLoading: true } }));
    try {
      await updateFeedback({ aiResponseId: versionState.aiResponseId, feedback });
      setMessageVersionState(prev => ({ ...prev, [messageId]: { ...versionState, feedback, feedbackLoading: false } }));
      toast.success('Feedback submitted!');
    } catch (err) {
      setMessageVersionState(prev => ({ ...prev, [messageId]: { ...versionState, feedbackLoading: false } }));
      devLogger.error('Failed to submit feedback:', err);
      toast.error('Failed to submit feedback');
    }
  }


  // Handle model select
  const handleModelSelect = async (messageId: string, newModel: ChatModelId) => {
    const versionState = messageVersionState[messageId];
    if (!versionState) return;
    const currentVersion = versionState.versions[versionState.currentVersionIndex];
    if (currentVersion.aiModel === newModel) return;
    await handleRegenerate(messageId, newModel);
  };

  // Handle regenerate
  const handleRegenerate = async (messageId: string, newModel: ChatModelId) => {
    const versionState = messageVersionState[messageId];
    if (!versionState) return;
    setMessageVersionState(prev => ({ ...prev, [messageId]: { ...versionState, isGenerating: true, streamingContent: "" } }));
    try {
      const response = await fetch('/api/stream/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiResponseId: versionState.aiResponseId, aiModel: newModel, conversationId }),
      });
      if (!response.body) throw new Error("Response body is null");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let animationFrameId: number | null = null;

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
            }
            // Ensure final state is set
            setMessageVersionState(prev => {
              const currentState = prev[messageId];
              const newVersions = [...currentState.versions, { responseText: accumulatedText, aiModel: newModel, createdAt: new Date() }];
              return {
                ...prev,
                [messageId]: {
                  ...currentState,
                  versions: newVersions,
                  currentVersionIndex: newVersions.length - 1,
                  isGenerating: false,
                  streamingContent: null,
                }
              };
            });
            break;
          }
          accumulatedText += decoder.decode(value);
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
          animationFrameId = requestAnimationFrame(() => {
            setMessageVersionState(prev => ({
              ...prev,
              [messageId]: { ...prev[messageId], streamingContent: accumulatedText }
            }));
          });
        }
      };

      await processStream();

    } catch (error) {
      handleErrorClient(error);
      setMessageVersionState(prev => ({ ...prev, [messageId]: { ...versionState, isGenerating: false, streamingContent: null } }));
    }
  };


  // Handle version change
  const handleVersionChange = (messageId: string, direction: 'next' | 'prev') => {
    const versionState = messageVersionState[messageId];
    if (!versionState) return;
    const { versions, currentVersionIndex } = versionState;
    const newIndex = direction === 'next' ? currentVersionIndex + 1 : currentVersionIndex - 1;
    if (newIndex >= 0 && newIndex < versions.length) {
      setMessageVersionState(prev => ({
        ...prev,
        [messageId]: { ...versionState, currentVersionIndex: newIndex }
      }));
    }
  };


  // Handle auto scroll
  const handleScroll = useCallback(() => {
    const container = scrollAreaRef.current;
    if (container) {
      const threshold = 100;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + threshold;
      atBottomRef.current = isAtBottom;
      setShowScrollToBottom(!isAtBottom);
    }
  }, []);


  // Handle streaming contents
  const streamingContents = useMemo(() =>
    Object.values(messageVersionState)
      .map(v => v.streamingContent)
      .filter(Boolean)
      .join(''),
    [messageVersionState]
  );

  // Handle last message
  const lastMessage = messages[messages.length - 1];


  // Handle scroll to bottom
  useEffect(() => {
    if (atBottomRef.current && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [streamIsLoading, streamingContents]);

  // Handle scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <>
      <div className="flex flex-col h-full bg-background text-foreground relative">
        <div ref={scrollAreaRef} onScroll={handleScroll} className="flex-1 px-4 py-6 overflow-y-auto w-full">
          <div className="space-y-6 max-w-3xl mx-auto px-5">
            {messages.map((message) => {
              const vercelMessage = message as VercelAIMessage;
              const versionState = messageVersionState[vercelMessage.id];
              let content: string | VercelAIContentPart[] = vercelMessage.content;
              let fileDataForRender: FileAttachmentType[] = [];
              let userPromptText = "";

              if (vercelMessage.role === 'user') {
                if ((vercelMessage.data as any)?.fileData) {
                  fileDataForRender = (vercelMessage.data as any)
                    .fileData as FileAttachmentType[];
                }

                if (typeof vercelMessage.content === "string") {
                  userPromptText = vercelMessage.content;
                } else if (Array.isArray(vercelMessage.content)) {
                  const textPart = vercelMessage.content.find(
                    (part): part is { type: "text"; text: string } => part.type === "text"
                  );
                  userPromptText = textPart ? textPart.text : "";
                }
              }

              if (vercelMessage.role === 'assistant' && versionState) {
                content = versionState.isGenerating
                  ? versionState.streamingContent!
                  : versionState.versions[versionState.currentVersionIndex]
                    .responseText;
              }
              return (
                <div key={vercelMessage.id} className="w-full">
                  {vercelMessage.role === "user" && (
                    <div className="flex justify-end mb-6">
                      <div className="flex flex-col items-end w-full">
                        {fileDataForRender.length > 0 && (
                          <div className="mb-2 flex flex-wrap justify-end gap-2">
                            {fileDataForRender.map((file, index) => (
                              <PromptFileItem key={index} fileData={file} />
                            ))}
                          </div>
                        )}
                        <div className="rounded-lg bg-accent px-4 py-2 max-w-xs mb-2 self-end">
                          <div className="leading-relaxed">{userPromptText}</div>
                        </div>
                        <div className="flex gap-2 self-end">
                          <Button variant="ghost" size={"icon"} className="rounded-[10px] size-8" onClick={() => handleCopyMessage(vercelMessage.id, userPromptText)}>
                            {copiedMessageId === vercelMessage.id ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {vercelMessage.role === "assistant" && (
                    <div className="flex justify-start mb-6">
                      <div className="flex flex-col w-full">
                        <div className="prose prose-invert">
                          {versionState?.isGenerating && versionState.streamingContent === "" ? (
                            <div className="size-3.5 bg-secondary rounded-full animate-pulse" />
                          ) : (
                            <div className="leading-relaxed whitespace-pre-wrap">{content as string}</div>
                          )}
                        </div>
                        {versionState && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="ghost" size={"icon"} className={`rounded-[10px] size-8 ${versionState.feedbackLoading ? 'opacity-50' : ''}`} onClick={() => handleFeedback(vercelMessage.id, 'GOOD')} disabled={versionState.feedback === 'BAD' || versionState.feedbackLoading || versionState.isGenerating}>
                              <ThumbsUp className="size-4" fill={versionState.feedback === 'GOOD' ? 'currentColor' : 'none'} />
                            </Button>
                            <Button variant="ghost" size={"icon"} className={`rounded-[10px] size-8 ${versionState.feedbackLoading ? 'opacity-50' : ''}`} onClick={() => handleFeedback(vercelMessage.id, 'BAD')} disabled={versionState.feedback === 'GOOD' || versionState.feedbackLoading || versionState.isGenerating}>
                              <ThumbsDown className="size-4" fill={versionState.feedback === 'BAD' ? 'currentColor' : 'none'} />
                            </Button>
                            <Button variant="ghost" size={"icon"} className="rounded-[10px] size-8" onClick={() => handleCopyMessage(vercelMessage.id, content as string)} disabled={versionState.isGenerating}>
                              {copiedMessageId === vercelMessage.id ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                            </Button>
                            {versionState.versions.length > 1 && (
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => handleVersionChange(vercelMessage.id, 'prev')} disabled={versionState.currentVersionIndex === 0 || versionState.isGenerating}>
                                  <ChevronLeft className="size-4" />
                                </Button>
                                <span className="text-xs text-muted-foreground">{`${versionState.currentVersionIndex + 1}/${versionState.versions.length}`}</span>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => handleVersionChange(vercelMessage.id, 'next')} disabled={versionState.currentVersionIndex === versionState.versions.length - 1 || versionState.isGenerating}>
                                  <ChevronRight className="size-4" />
                                </Button>
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-[10px] size-8" disabled={versionState.isGenerating}>
                                  <ChevronDown className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64">
                                {chatModels.map(model => (
                                  <DropdownMenuItem key={model.id} onClick={() => handleModelSelect(vercelMessage.id, model.id)}>
                                    <div className="flex flex-col flex-grow">
                                      <span>{model.label}</span>
                                      <span className="text-xs text-muted-foreground">{model.description}</span>
                                    </div>
                                    {versionState.versions[versionState.currentVersionIndex].aiModel === model.id && <Check className="size-4 ml-2" />}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {streamIsLoading && <div className="size-3.5 bg-secondary rounded-full animate-pulse" />}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {showScrollToBottom && (
          <Button
            onClick={scrollToBottom}
            variant="outline"
            size="icon"
            className="absolute bottom-38 left-1/2 -translate-x-1/2 z-10 rounded-full bg-background/50 backdrop-blur-sm"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center justify-center pb-4 px-5 bg-transparent">
          <PromptInput
            prompt={input}
            setPrompt={setInput}
            files={uploadedFiles}
            setFiles={setUploadedFiles}
            inputRef={fileInputRef}
            onSubmit={(text) => onPromptSubmit(text)}
            disabled={streamIsLoading || Object.values(messageVersionState).some(s => s.isGenerating)}
          />
        </div>
      </div>
    </>
  );
}
