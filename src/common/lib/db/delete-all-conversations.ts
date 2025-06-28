"use server";
import { revalidatePath } from "next/cache";
import {
  AiResponse,
  Conversation,
  Message,
  Prompt,
} from "~/common/models/schema";
import connectToDB from "../connect-to-db";
import devLogger from "~/common/utils/dev-logger";



export async function deleteAllConversations(userId: string) {
  await connectToDB();

  try {
    // Find all conversations for the user
    const conversations = await Conversation.find({ userId }).select("_id").lean();
    const conversationIds = conversations.map((c) => c._id);

    if (conversationIds.length === 0) {
      devLogger.log("No conversations to delete.");
      return { success: true };
    }

    // Find all prompts for the conversations
    const prompts = await Prompt.find({
      conversationId: { $in: conversationIds },
    })
      .select("_id")
      .lean();
    const promptIds = prompts.map((p) => p._id);

    // Delete all AiResponses associated with the prompts
    if (promptIds.length > 0) {
      await AiResponse.deleteMany({ promptId: { $in: promptIds } });
    }

    // Delete all prompts for the conversations
    await Prompt.deleteMany({ conversationId: { $in: conversationIds } });

    // Delete all messages for the conversations
    await Message.deleteMany({ conversationId: { $in: conversationIds } });

    // Delete all conversations for the user
    await Conversation.deleteMany({ userId });

    devLogger.log(`All conversations for user ${userId} deleted.`);
    revalidatePath("/"); // Revalidate the home page to refresh the sidebar
    return { success: true };
  } catch (error) {
    devLogger.error(`Error deleting conversations for user ${userId}:`, error);
    return { success: false, error: "Failed to delete conversations." };
  }
}
