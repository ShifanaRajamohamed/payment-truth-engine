import { envConfig } from './env.config';

export const sarvamConfig = {
  apiKey: envConfig.sarvamApiKey,
  baseUrl: 'https://api.sarvam.ai',
  sttModel: 'saaras:v1',
  ttsModel: 'bulbul:v1'
};
