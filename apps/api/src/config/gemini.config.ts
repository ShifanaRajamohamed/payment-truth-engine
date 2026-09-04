import { envConfig } from './env.config';

export const geminiConfig = {
  apiKey: envConfig.geminiApiKey,
  defaultModel: 'gemini-2.5-flash',
  temperature: 0.2,
  maxTokens: 1000
};
