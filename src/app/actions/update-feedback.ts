"use server";
import { AiResponse } from "~/common/models/schema";
import connectToDb from "~/common/lib/connect-to-db";
import devLogger from "~/common/utils/dev-logger";



export default async function updateFeedback({ aiResponseId, feedback }: { aiResponseId: string, feedback: 'GOOD' | 'BAD' }) {
  await connectToDb();
  try {
    devLogger.log(`Updating feedback for aiResponseId: ${aiResponseId}`);

    // Find AI response
    const aiResponse = await AiResponse.findById(aiResponseId);

    // If AI response not found, throw an error
    if (!aiResponse) {
      throw new Error('AI response not found');
    }

    // Update feedback
    aiResponse.feedback = feedback;
    await aiResponse.save();

    devLogger.log(`Feedback updated successfully for aiResponseId: ${aiResponseId}`);
    return { success: true };
  } catch (error) {
    devLogger.error('Error updating feedback:', error);
    throw new Error('Failed to update feedback');
  }
}
