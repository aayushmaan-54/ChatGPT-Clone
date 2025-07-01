/* eslint-disable @typescript-eslint/no-explicit-any */
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { CoreMessage, streamText } from "ai";
import { Message } from "mem0ai";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_CHAT_MODEL } from "~/common/data/chat-model";
import { getAIContextMessages } from "~/common/lib/db/get-all-messages";
import mem0Client from "~/common/lib/mem0-client";
import { AiResponse, Message as MessageSchema, Prompt, PromptType } from "~/common/models/schema";
import { VercelAIMessage } from "~/common/types/types";
import constructContextHistory from "~/common/utils/construct-context-history";
import devLogger from "~/common/utils/dev-logger";
import validatePromptQuota from "~/common/lib/validate-prompt-quota";
import connectToDB from "~/common/lib/connect-to-db";



export async function POST(request: NextRequest) {
  try {
    // Establish database connection first
    await connectToDB();

    // Check Prompt Quota
    const { userId } = await auth();
    let ipAddress: string | null = null;
    if (!userId) {
      const requestHeaders = await headers();
      ipAddress = (requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "UNKNOWN").split(",")[0].trim();
      const isAllowed = await validatePromptQuota(ipAddress);
      if (!isAllowed) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429 });
      }
    }
    const allMessages: VercelAIMessage[] = [];

    const { promptId, aiModel, conversationId } = await request.json();
    console.log("Received payload:", { promptId, aiModel, conversationId });


    // Insert AI Response Document with an empty versions array initially
    const aiResponse = await AiResponse.create({
      promptId: promptId,
      feedback: "NEUTRAL",
      versions: [],
    });

    // Get Prompt Data we need
    const promptData = await Prompt.findOne(
      { _id: promptId },
      'promptText'
    ).lean() as unknown as PromptType;
    if (!promptData) {
      return new Response(JSON.stringify({ error: "Prompt not found" }), { status: 404 });
    }


    if (userId) {
      try {
        const userMemories = await mem0Client.search(promptData.promptText, { user_id: userId });
        if (userMemories && userMemories.length > 0) {
          userMemories.forEach((mem: any) => {
            allMessages.push({
              id: uuidv4(),
              role: "system",
              content: `User Data and fact: ${mem.memory}`,
            });
          });
        }
      } catch (mem0Error) {
        devLogger.error("Failed to retrieve user memories from mem0:", mem0Error);
      }
    }

    // Get all conversation message and trim that
    const allContextMessages = await getAIContextMessages(conversationId, promptId);
    allContextMessages.push(...allMessages);

    allContextMessages.push({
      id: uuidv4(),
      role: "user",
      content: promptData.promptText
    });

    const trimmedAiContextMessages = await constructContextHistory(
      aiModel || DEFAULT_CHAT_MODEL,
      allContextMessages
    );



    const result = streamText({
      model: openai(aiModel || DEFAULT_CHAT_MODEL),
      system: `You are ChatGPT, an advanced AI language model.
Respond to users in a friendly, conversational tone.
Provide thorough, detailed answers with helpful explanations, examples, and markdown formatting (including headings, bullet points, and code blocks when appropriate).
If the user asks for code, always use markdown code blocks.
Aim for clarity and completeness, similar to responses given by ChatGPT on chat.openai.com.  also use emojis when appropriate.`,
      messages: trimmedAiContextMessages as CoreMessage[],
      onFinish: async (result) => {
        await AiResponse.updateOne({ _id: aiResponse._id }, {
          $push: {
            versions: {
              responseText: result.text,
              aiModel: aiModel || DEFAULT_CHAT_MODEL,
            }
          }
        });

        await MessageSchema.create({
          conversationId: conversationId,
          userId: userId || null,
          ipAddr: ipAddress,
          promptId: [promptId],
          aiResponseId: [aiResponse._id],
          messageOrder: 1,
        });

        if (userId) {
          try {
            const message: Message[] = [
              { role: "user", content: promptData.promptText },
              { role: "assistant", content: result.text }
            ];

            await mem0Client.add(message, { user_id: userId });
            devLogger.info(`Successfully saved user memory for userId: ${userId}`);
          } catch (mem0Error) {
            devLogger.error("Failed to save AI response to Mem0:", mem0Error);
          }
        }
      }
    });



    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Ai-Response-Id': aiResponse._id.toString(),
      }
    });
  } catch (error) {
    devLogger.error("Error in AI response route:", error);
    throw error;
  }
}
