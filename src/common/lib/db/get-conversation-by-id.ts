/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { Conversation, ConversationType } from "~/common/models/schema";
import connectToDB from "../connect-to-db";
import { auth } from "@clerk/nextjs/server";
import { ClientConversationType } from "../../types/types";



export async function getConversationById(
  conversationId: string,
): Promise<ClientConversationType | null> {
  await connectToDB();
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Find conversation by id and user id
  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId: userId,
  }).lean();

  if (!conversation) {
    return null;
  }

  // Convert conversation to client type
  const conv = conversation as unknown as ConversationType;
  const { _id, lastActiveAt, createdAt, updatedAt, messageId, ...rest } = conv;

  // Return conversation
  return {
    ...rest,
    conversationTitle: conv.conversationTitle as string,
    _id: _id.toString(),
    lastActiveAt: new Date(
      (lastActiveAt as any) ?? (createdAt as any),
    ).toISOString(),
    createdAt: new Date(createdAt as any).toISOString(),
    updatedAt: new Date(updatedAt as any).toISOString(),
    messageId: (messageId ?? []).map((id: any) => id.toString()),
    userId: conv.userId,
    ipAddr: conv.ipAddr ? conv.ipAddr.toString() : undefined,
  };
}
