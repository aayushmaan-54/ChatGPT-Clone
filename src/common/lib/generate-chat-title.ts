import { generateText } from "ai";
import devLogger from "../utils/dev-logger";
import { openai } from '@ai-sdk/openai';



export const generateChatTitle = async (prompt: string): Promise<string> => {
  try {
    const truncatedPrompt = prompt.length > 200 ? prompt.slice(0, 200) + "..." : prompt; // Truncate to 200 characters for better performance

    const { text } = await generateText({ // Use AI SDK to generate title with low config ai model for cost efficiency
      model: openai("gpt-3.5-turbo"),
      prompt: `Generate a concise 2-5 word title for this conversation. Be specific and descriptive.

Examples:
- "Fix Python Error"
- "Plan Japan Trip"
- "Recipe for Pasta"
- "Resume Writing Help"

User message: ${truncatedPrompt}

Title:`,
      maxTokens: 15,
      temperature: 0.2,
    });

    const title = text.trim()
      .replace(/^["'`]|["'`]$/g, "") // Remove surrounding quotes
      .replace(/^Title:\s*/i, "") // Remove "Title:" prefix if present
      .split(/\s+/) // Split by whitespace
      .slice(0, 5) // Limit to 5 words
      .join(" ");

    if (!title || title.length < 2) {
      throw new Error("Generated title too short");
    }

    return title;

  } catch (error) {
    devLogger.error("Title generation failed:", error);

    const fallbackTitle = prompt
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 2) // Filter out short words
      .slice(0, 3) // Limit to 3 words
      .join(" ");

    return fallbackTitle || "New Chat";
  }
};
