"use server";
import { revalidatePath } from "next/cache";
import { Conversation } from "~/common/models/schema";
import connectToDB from "../connect-to-db";
import devLogger from "~/common/utils/dev-logger";



export async function updateConversationTitle(conversationId: string, newTitle: string) {
  await connectToDB();

  try {
    // Update conversation title
    await Conversation.findByIdAndUpdate(conversationId, { conversationTitle: newTitle });
    devLogger.log(`Conversation ${conversationId} title updated to "${newTitle}".`);
    revalidatePath('/');
    revalidatePath(`/c/${conversationId}`);
    return { success: true };
  } catch (error) {
    devLogger.error(`Error updating conversation title for ${conversationId}:`, error);
    return { success: false, error: "Failed to update title." };
  }
}
