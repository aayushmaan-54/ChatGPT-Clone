/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import connectToDB from "../connect-to-db";
import devLogger from "~/common/utils/dev-logger";
import {
  AiResponseType,
  Message,
  PromptType,
} from "~/common/models/schema";
import {
  AllPopulatedMessage,
  MessageGroup,
  VercelAIContentPart,
  VercelAIMessage
} from "~/common/types/types";
import getAiSdkFileData from "~/common/utils/get-ai-sdk-filedata";



const getAllMessages = async (
  conversationId: string,
  excludePromptId?: string
): Promise<AllPopulatedMessage[]> => {
  connectToDB();
  try {
    const allMessages = await Message.find({ conversationId })
      .sort({ messageOrder: 1 })
      .populate('promptId')
      .populate('aiResponseId')
      .lean() as unknown as AllPopulatedMessage[];


    const filteredMessages = excludePromptId
      ? allMessages.filter(msg =>
        !msg.promptId.some(
          (prompt: any) => prompt._id?.toString() === excludePromptId
        )
      )
      : allMessages;


    return filteredMessages;
  } catch (error) {
    devLogger.error("Error fetching messages:", error);
    throw error;
  }
}

/*
[
  {
    _id: "65e8a0000000000000000001", // Message _id (ObjectId)
    conversationId: "conv123",
    userId: "user_clerkid_xyz",
    messageOrder: 1,
    promptId: [ // Prompt Document(s) populated
      {
        _id: "65e8a0000000000000000101", // Prompt _id (ObjectId)
        conversationId: "conv123",
        previousPromptId: null,
        promptText: "What is recursion?",
        ...
      }
    ],
    aiResponseId: [ // AiResponseType Document(s) populated
      {
        _id: "65e8a0000000000000000201", // AiResponse _id (ObjectId)
        promptId: "65e8a0000000000000000101",
        responseText: "Recursion is when a function calls itself.",
        ...
      }
    ]
  },
  {
    _id: "65e8a0000000000000000002", //  Message _id
    conversationId: "conv123",
    userId: "user_clerkid_xyz",
    messageOrder: 2,
    promptId: [
      {
        _id: "65e8a0000000000000000102",
        conversationId: "conv123",
        previousPromptId: "65e8a0000000000000000101",
        promptText: "Explain recursion with an example.",
        ...
      }
    ],
    aiResponseId: [
      {
        _id: "65e8a0000000000000000202",
        promptId: "65e8a0000000000000000102",
        responseText: "For example, factorial(n) = n * factorial(n-1).",
        ...
      }
    ]
  }
  ...
]
*/



export async function getAIContextMessages(
  conversationId: string,
  excludePromptId?: string
): Promise<VercelAIMessage[]> {
  await connectToDB();
  try {
    const messages = await getAllMessages(conversationId, excludePromptId);
    const aiContextMessages: VercelAIMessage[] = [];

    for (const message of messages) {
      if (message.promptId?.length) {
        const latestPrompt = message.promptId.reduce((prev: PromptType, current: PromptType) => {
          const prevDate = prev.createdAt ? new Date(prev.createdAt) : new Date(0);
          const currentDate = current.createdAt ? new Date(current.createdAt) : new Date(0);
          return prevDate > currentDate ? prev : current;
        });

        const contentParts: VercelAIContentPart[] = [];

        if (latestPrompt.promptText?.trim()) {
          contentParts.push({ type: 'text', text: latestPrompt.promptText });
        }

        if (latestPrompt.fileAttachments?.length) {
          for (const file of latestPrompt.fileAttachments) {
            const fileDataResult = await getAiSdkFileData(file);
            contentParts.push({ type: 'file', data: fileDataResult.data, mimeType: fileDataResult.mimeType });
          }
        }

        aiContextMessages.push({
          id: latestPrompt._id.toString(),
          role: "user",
          content: contentParts.length === 1 && contentParts[0].type === 'text' ? contentParts[0].text : contentParts
        });

        if (message.aiResponseId?.length) {
          const responsesForLatestPrompt = message.aiResponseId.filter(
            (response: AiResponseType) => response.promptId?.toString() === latestPrompt._id.toString()
          );

          if (responsesForLatestPrompt.length > 0) {
            const latestResponse = responsesForLatestPrompt[responsesForLatestPrompt.length - 1];

            if (latestResponse.versions && latestResponse.versions.length > 0) {
              const latestVersion = latestResponse.versions[latestResponse.versions.length - 1];
              if (latestVersion.responseText?.trim()) {
                aiContextMessages.push({
                  id: latestResponse._id.toString(),
                  role: "assistant",
                  content: latestVersion.responseText
                });
              }
            }
          }
        }
      }
    }

    return aiContextMessages;
  } catch (error) {
    devLogger.error("Error preparing AI context:", error);
    throw error;
  }
}

/*
[
  {
    role: "system",
    content: "You are a helpful AI assistant. Provide clear and concise responses."
  },
  {
    role: "user",
    content: "What is recursion?"
  },
  {
    role: "assistant",
    content: "It helps in solving problems by dividing them."
  },
  {
    role: "user",
    content: [
      {
        type: "text",
        text: "Can you explain with a PDF?"
      },
      {
        type: "file",
        data: ArrayBuffer { byteLength: 12345 },
        mimeType: "application/pdf"
      }
    ]
  },
  {
    role: "assistant",
    content: "Sure, I've analyzed the PDF and here's a summary."
  }
];
*/



export async function getAllHistoryMessages(
  conversationId: string,
): Promise<MessageGroup[]> {
  await connectToDB();
  try {
    const allMessages = await Message.find({ conversationId })
      .sort({ messageOrder: 1 })
      .populate({
        path: 'promptId',
        populate: {
          path: 'fileAttachments',
          model: 'FileAttachment',
        },
      })
      .populate({
        path: 'aiResponseId',
        populate: {
          path: 'versions',
          model: 'AiResponseVersion',
        },
      })
      .lean();

    const messageGroups: MessageGroup[] = allMessages.map((message: any) => {
      const messageChain: VercelAIMessage[] = [];

      // User Message
      if (message.promptId && message.promptId.length > 0) {
        const prompt = message.promptId[0];
        if (prompt) {
          messageChain.push({
            id: prompt._id.toString(),
            role: 'user',
            content: prompt.promptText,
            data: {
              fileData: prompt.fileAttachments ?? [],
            },
          });
        }
      }

      // Assistant Message
      if (message.aiResponseId && message.aiResponseId.length > 0) {
        const aiResponse = message.aiResponseId[0];
        if (aiResponse && aiResponse.versions && aiResponse.versions.length > 0) {
          const latestVersionIndex = aiResponse.versions.length - 1;

          messageChain.push({
            id: aiResponse._id.toString(),
            role: 'assistant',
            content:
              aiResponse.versions[latestVersionIndex]?.responseText ?? '',
            data: {
              aiResponseId: aiResponse._id.toString(),
              versions: aiResponse.versions,
              currentVersionIndex: latestVersionIndex,
              feedback: aiResponse.feedback,
            },
          });
        }
      }

      return { messageChain };
    });

    return messageGroups.filter(group => group.messageChain.length > 0);
  } catch (error) {
    devLogger.error('Error fetching all history messages:', error);
    throw error;
  }
}

/*
const exampleOutput: MessageGroup[] = [
  {
    messageChain: [
      {
        promptId: "65a1b2c3d4e5f6a7b8c9d0e1",
        promptText: "What is the capital of France?",
        responses: [
          {
            _id: "65a1b2c3d4e5f6a7b8c9d0e2",
            responseText: "The capital of France is Paris.",
            responseVersion: 1,
            aiModel: "gpt-4",
            feedback: "GOOD"
          },
          {
            _id: "65a1b2c3d4e5f6a7b8c9d0e3",
            responseText: "Paris is the capital city of France.",
            responseVersion: 2,
            aiModel: "gpt-4-turbo",
            feedback: "NEUTRAL"
          }
        ],
        fileAttachments: []
      }
    ]
  },
  {
    messageChain: [
      {
        promptId: "75b2c3d4e5f6a7b8c9d0e1f2",
        promptText: "Explain quantum computing basics",
        responses: [
          {
            _id: "75b2c3d4e5f6a7b8c9d0e1f3",
            responseText: "Quantum computing uses qubits which can exist in superposition...",
            responseVersion: 1,
            aiModel: "gpt-4",
            feedback: "NEUTRAL"
          }
        ],
        fileAttachments: [
          {
            fileName: "quantum.pdf",
            fileSize: 1024,
            cloudinaryUrl: "https://res.cloudinary.com/.../quantum.pdf",
            mimeType: "application/pdf"
          }
        ]
      }
    ]
  }
];
*/
