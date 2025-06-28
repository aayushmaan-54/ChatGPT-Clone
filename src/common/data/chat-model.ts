export const chatModels = [
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    description: 'Fast, smart, and multimodal. Best for most tasks.',
    contextWindowSize: 128000, // 128K tokens
  },
  {
    id: 'gpt-4',
    label: 'GPT-4',
    description: 'Highly accurate but slower and more expensive.',
    contextWindowSize: 8192, // The standard GPT-4 (gpt-4-0613) has an 8K context.
  },
  {
    id: 'gpt-4-turbo',
    label: 'GPT-4 Turbo',
    description: 'Optimized GPT-4 with improved speed and larger context.',
    contextWindowSize: 128000, // 128K tokens
  },
  {
    id: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    description: 'Very fast and affordable. Great for everyday use.',
    contextWindowSize: 16385, // Current gpt-3.5-turbo alias is typically 16K.
  }
] as const;



export default chatModels;
export type ChatModelId = typeof chatModels[number]['id'];

export const DEFAULT_CHAT_MODEL: ChatModelId = 'gpt-3.5-turbo';
