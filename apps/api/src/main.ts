import { createApp } from './app.module';
import { envConfig } from './config/env.config';

const app = createApp();
const PORT = envConfig.port || 3000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛡️  DeepAudit AI Backend Service`);
  console.log(`📡  Listening on port ${PORT}`);
  console.log(`⚡  Environment: ${envConfig.nodeEnv}`);
  console.log(`🤖  Gemini API Key: ${envConfig.geminiApiKey ? 'CONFIGURED' : 'PENDING (Will use deterministic fallbacks)'}`);
  console.log(`🎙️  Sarvam API Key: ${envConfig.sarvamApiKey ? 'CONFIGURED' : 'PENDING (Will use provider fallbacks)'}`);
  console.log(`====================================================`);
});
