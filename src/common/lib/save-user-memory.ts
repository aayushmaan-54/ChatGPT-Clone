import { Message } from "mem0ai";
import devLogger from "../utils/dev-logger";
import mem0Client from "./mem0-client";


// Save user memory to Mem0
export default async function saveUserMemory(
  userId: string,
  response: string,
  prompt: string
): Promise<boolean> {
  if (!userId) {
    devLogger.warn("Attempted to save user memory without a userId.");
    return false;
  }

  const message: Message[] = [
    { role: "user", content: prompt },
    { role: "assistant", content: response }
  ];

  try {
    await mem0Client.add(message, { user_id: userId });
    devLogger.info(`Successfully saved user memory for userId: ${userId}`);
    return true;
  } catch (error) {
    devLogger.error(`Failed to save user memory for userId: ${userId}`, error);
    return false;
  }
}
