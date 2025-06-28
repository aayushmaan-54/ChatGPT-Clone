/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import connectToDB from "~/common/lib/connect-to-db";
import { generateChatTitle } from "~/common/lib/generate-chat-title";
import validatePromptQuota from "~/common/lib/validate-prompt-quota";
import {
  AnonymousUser,
  Conversation,
  Prompt,
} from "~/common/models/schema";
import { SavePromptDataProps } from "~/common/types/props.types";
import { ClientConversationType } from "~/common/types/types";
import devLogger from "~/common/utils/dev-logger";

const MAX_TOTAL_SIZE = 10 * 1024 * 1024;
const MAX_FILE_COUNT = 5;



export default async function savePromptData({
  conversationId,
  prompt,
  files,
  previousPromptId = null,
}: SavePromptDataProps) {
  await connectToDB();
  try {
    const { userId } = await auth();
    const requestHeaders = await headers();
    const ipAddress = (requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "UNKNOWN").split(",")[0].trim();

    // If user is not signed in, validate prompt quota
    if (!userId) {
      if (ipAddress === "UNKNOWN") {
        devLogger.warn("Anonymous user request received without a detectable IP address.");
        throw new Error("Unable to identify your connection. Please try again or sign in.");
      }
      const canPrompt = await validatePromptQuota(ipAddress);
      if (!canPrompt) {
        throw new Error("You have exceeded the prompt limit. Please try again after 24 hours or create an account to continue.");
      }
    }


    if (!prompt?.trim() || prompt.trim().length === 0) {
      throw new Error("Prompt is required");
    }


    // If files are attached, validate file size & count
    if (files) {
      if (files.length > MAX_FILE_COUNT) {
        throw new Error(`Too many files attached (maximum ${MAX_FILE_COUNT} files allowed).`);
      }

      let totalSize = 0;
      for (const file of files) {
        if (!file.cloudinaryUrl || !file.fileName || typeof file.fileSize !== "number" || file.fileSize < 0 || !file.mimeType) {
          throw new Error("Invalid file data: missing or malformed file properties (url, filename, size, mimeType).");
        }
        totalSize += file.fileSize;
      }

      if (totalSize > MAX_TOTAL_SIZE) {
        throw new Error(`Total file size exceeds the limit of ${MAX_TOTAL_SIZE / (1024 * 1024)} MB.`);
      }
    }


    // If user is not signed in, update anonymous user query count
    if (!userId) {
      await AnonymousUser.findOneAndUpdate(
        {
          ipAddress: ipAddress,
        },
        [
          {
            $set: {
              queryCount: { $add: ["$queryCount", 1] },
              lastQueryAt: new Date(),
            }
          },
          {
            $set: {
              firstQueryAt: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ["$firstQueryAt", null] },
                      { $lt: ["$firstQueryAt", new Date(Date.now() - 24 * 60 * 60 * 1000)] }
                    ]
                  },
                  then: new Date(),
                  else: "$firstQueryAt"
                }
              }
            }
          }
        ],
        { new: true, upsert: true }
      );
    }


    // Generate conversation title
    const conversationTitle = await generateChatTitle(prompt);


    // Update conversation
    const updatedConversation: any = await Conversation.findOneAndUpdate(
      { _id: conversationId },
      {
        $inc: { messageCount: 1 },
        $set: {
          lastActiveAt: new Date(),
        },
        $setOnInsert: {
          userId: userId || null,
          ipAddr: ipAddress || null,
          conversationTitle: conversationTitle || "New Chat",
        }
      },
      { upsert: true, new: true }
    ).lean();

    // If conversation is not updated, throw an error
    if (!updatedConversation) {
      throw new Error("Failed to create or update conversation.");
    }

    // Create prompt data
    const promptData = await Prompt.create({
      conversationId: conversationId,
      previousPromptId: previousPromptId,
      promptText: prompt,
      fileAttachments: files || [],
    });

    // Convert prompt data to plain object
    const plainPromptData: any = promptData.toObject({
      getters: true,
      virtuals: true
    });

    // Convert _id (and 'id' if it exists as an alias) to string explicitly
    if (plainPromptData._id) {
      plainPromptData._id = plainPromptData._id.toString();
    }

    // ensure it's a string if it exists
    if ((plainPromptData as any).id) {
      (plainPromptData as any).id = (plainPromptData as any).id.toString();
    }

    // Convert previousPromptId to string if it's an ObjectId type
    if (plainPromptData.previousPromptId && typeof plainPromptData.previousPromptId !== 'string') {
      plainPromptData.previousPromptId = plainPromptData.previousPromptId.toString();
    }

    // Convert conversation to client type
    const conversationForClient: ClientConversationType = {
      _id: updatedConversation._id.toString(),
      userId: (updatedConversation.userId as any)?.toString(),
      ipAddr: updatedConversation.ipAddr,
      conversationTitle: updatedConversation.conversationTitle,
      messageCount: updatedConversation.messageCount,
      lastActiveAt: updatedConversation.lastActiveAt.toISOString(),
      createdAt: updatedConversation.createdAt.toISOString(),
      updatedAt: updatedConversation.updatedAt.toISOString(),
      messageId: (updatedConversation.messageId as any[]).map(id => id.toString()),
    };

    // Return prompt data and conversation for client
    return {
      prompt: plainPromptData,
      conversation: conversationForClient,
    };
  } catch (error) {
    devLogger.error("Error saving prompt data:", error);
    throw error;
  }
}
