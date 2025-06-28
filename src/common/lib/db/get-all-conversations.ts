/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { auth } from "@clerk/nextjs/server";
import { Conversation } from "~/common/models/schema";
import connectToDB from "../connect-to-db";
import devLogger from "~/common/utils/dev-logger";
import { ClientConversationType } from "../../types/types";

export async function getAllConversations({
  page = 1,
  limit = 25,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<{ conversations: ClientConversationType[]; hasMore: boolean }> {
  await connectToDB();
  const { userId } = await auth();

  if (!userId) {
    devLogger.log("User not authenticated");
    return { conversations: [], hasMore: false };
  }

  try {
    const skip = (page - 1) * limit;
    const [conversations, totalConversations] = await Promise.all([
      Conversation.find({
        userId,
      })
        .sort({ lastActiveAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments({ userId }),
    ]);

    const clientConversations: ClientConversationType[] = (conversations as any[]).map(
      (conv) => ({
        _id: conv._id.toString(),
        userId: conv.userId,
        ipAddr: conv.ipAddr ? conv.ipAddr.toString() : undefined,
        conversationTitle: conv.conversationTitle,
        messageCount: conv.messageCount,
        lastActiveAt: new Date(
          (conv.lastActiveAt as any) ?? (conv.createdAt as any),
        ).toISOString(),
        createdAt: new Date(conv.createdAt as any).toISOString(),
        updatedAt: new Date(conv.updatedAt as any).toISOString(),
        messageId: (conv.messageId ?? []).map((id: any) => id.toString()),
      }),
    );

    const hasMore = page * limit < totalConversations;
    return { conversations: clientConversations, hasMore };
  } catch (error) {
    devLogger.error("Error fetching conversations:", error);
    return { conversations: [], hasMore: false };
  }
}
