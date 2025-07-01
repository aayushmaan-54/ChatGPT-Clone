/* eslint-disable @typescript-eslint/no-explicit-any */
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { CoreMessage, streamText } from "ai";
import { Message } from "mem0ai";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getAIContextMessages } from "~/common/lib/db/get-all-messages";
import mem0Client from "~/common/lib/mem0-client";
import { AiResponse, AiResponseType, Prompt, PromptType } from "~/common/models/schema";
import validatePromptQuota from "~/common/lib/validate-prompt-quota";
import constructContextHistory from "~/common/utils/construct-context-history";
import devLogger from "~/common/utils/dev-logger";
import connectToDB from "~/common/lib/connect-to-db";



export async function POST(request: NextRequest) {
  try {
    // Establish database connection first
    await connectToDB();

    const { userId } = await auth();
    if (!userId) {
      const requestHeaders = await headers();
      const ipAddress = (requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "UNKNOWN").split(",")[0].trim();
      const isAllowed = await validatePromptQuota(ipAddress);
      if (!isAllowed) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429 });
      }
    }
    const { aiResponseId, aiModel, conversationId } = await request.json();

    // Find AI response
    const aiResponse = await AiResponse.findById(aiResponseId).lean() as unknown as AiResponseType;
    if (!aiResponse) {
      return new Response(JSON.stringify({ error: "AI Response not found" }), { status: 404 });
    }

    // Find prompt
    const prompt = await Prompt.findById(aiResponse.promptId).lean() as unknown as PromptType;
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt not found" }), { status: 404 });
    }

    // Get all context messages
    const allContextMessages = await getAIContextMessages(conversationId, prompt._id.toString());

    // If user is signed in, get user memories
    if (userId) {
      try {
        const userMemories = await mem0Client.search(prompt.promptText, { user_id: userId });
        if (userMemories && userMemories.length > 0) {
          userMemories.forEach((mem: any) => {
            allContextMessages.push({ id: uuidv4(), role: "system", content: `User Data and fact: ${mem.memory}` });
          });
        }
      } catch (mem0Error) {
        devLogger.error("Failed to retrieve user memories from mem0:", mem0Error);
      }
    }

    // Add user prompt to context messages
    allContextMessages.push({ id: uuidv4(), role: "user", content: prompt.promptText });

    // Construct context history
    const trimmedAiContextMessages = await constructContextHistory(aiModel, allContextMessages);

    // Stream text
    const result = streamText({
      model: openai(aiModel),
      system:  `You are ChatGPT, an advanced AI language model.
      Respond to users in a friendly, conversational tone.
      Provide thorough, detailed answers with helpful explanations, examples, and markdown formatting (including headings, bullet points, and code blocks when appropriate).
      If the user asks for code, always use markdown code blocks.
      Aim for clarity and completeness, similar to responses given by ChatGPT on chat.openai.com.  also use emojis when appropriate.`,
      messages: trimmedAiContextMessages as CoreMessage[],
      onFinish: async (result) => {
        await AiResponse.updateOne({ _id: aiResponseId }, {
          $push: {
            versions: {
              responseText: result.text,
              aiModel: aiModel,
            }
          }
        });

        // If user is signed in, save AI response to Mem0
        if (userId) {
          try {
            const message: Message[] = [
              { role: "user", content: prompt.promptText },
              { role: "assistant", content: result.text }
            ];
            await mem0Client.add(message, { user_id: userId });
          } catch (mem0Error) {
            devLogger.error("Failed to save AI response to Mem0:", mem0Error);
          }
        }
      }
    });

    return result.toTextStreamResponse();
  } catch (error) {
    devLogger.error("Error in AI regenerate route:", error);
    throw error;
  }
}
