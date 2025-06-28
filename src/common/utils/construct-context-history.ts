/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEncoding, type TiktokenEncoding } from "js-tiktoken";
import chatModels, { ChatModelId } from "../data/chat-model";
import devLogger from "./dev-logger";
import { VercelAIMessage } from "../types/types";

const RESPONSE_TOKEN_BUFFER = 1500;

export default async function constructContextHistory(
  modelId: ChatModelId,
  messages: VercelAIMessage[],
  responseTokenBuffer = RESPONSE_TOKEN_BUFFER
): Promise<VercelAIMessage[]> {
  const modelConfig = chatModels.find(m => m.id === modelId);
  if (!modelConfig) {
    devLogger.error(`Unknown model: ${modelId} in constructContextHistory`);
    throw new Error(`Unknown model: ${modelId}`);
  }

  // Map common model IDs to tiktoken encodings
  const getEncodingName = (modelId: string): TiktokenEncoding => {
    if (modelId.includes('gpt-4')) return 'cl100k_base';
    if (modelId.includes('gpt-3.5')) return 'cl100k_base';
    if (modelId.includes('claude')) return 'cl100k_base'; // Approximation
    return 'cl100k_base'; // Default fallback
  };

  const enc = getEncoding(getEncodingName(modelId));
  const maxTokens = modelConfig.contextWindowSize - responseTokenBuffer;

  let tokenCount = 0;
  const trimmed: VercelAIMessage[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    let contentString: string;
    if (typeof msg.content === "string") {
      contentString = msg.content;
    } else {
      contentString = msg.content
        .filter(part => part.type === "text")
        .map(part => (part as { type: "text"; text: string }).text)
        .join(" ");
    }
    const tokens = enc.encode(contentString).length + 4;

    if (tokenCount + tokens <= maxTokens) {
      trimmed.push(msg);
      tokenCount += tokens;
    } else {
      break;
    }
  }

  return trimmed.reverse();
}
