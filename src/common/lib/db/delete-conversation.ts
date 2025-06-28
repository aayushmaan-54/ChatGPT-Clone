"use server";

import { revalidatePath } from "next/cache";
import { AiResponse, Conversation, Message, Prompt } from "~/common/models/schema";
import connectToDB from "../connect-to-db";
import devLogger from "~/common/utils/dev-logger";

export async function deleteConversation(conversationId: string) {
  await connectToDB();

  try {
    // Find all prompts for the conversation
    const prompts = await Prompt.find({ conversationId }).select('_id').lean();
    const promptIds = prompts.map(p => p._id);

    // Delete all AiResponses associated with the prompts
    await AiResponse.deleteMany({ promptId: { $in: promptIds } });

    // Delete all prompts for the conversation
    await Prompt.deleteMany({ conversationId });

    // Delete all messages for the conversation
    await Message.deleteMany({ conversationId });

    // Delete the conversation itself
    await Conversation.findByIdAndDelete(conversationId);

    devLogger.log(`Conversation ${conversationId} and all associated data deleted.`);
    revalidatePath('/'); // Revalidate the home page to refresh the sidebar
    return { success: true };
  } catch (error) {
    devLogger.error(`Error deleting conversation ${conversationId}:`, error);
    return { success: false, error: "Failed to delete conversation." };
  }
}
