import { VoiceProviderFactory, VoiceProvider } from '@deepaudit/voice';
import { STTRequest, STTResponse, TTSRequest, TTSResponse } from '@deepaudit/shared-types';
import { envConfig } from '../../config/env.config';

export class VoiceService {
  private static instance: VoiceService;
  private provider: VoiceProvider;

  private constructor() {
    this.provider = VoiceProviderFactory.getProvider(envConfig.sarvamApiKey);
  }

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  async transcribe(request: STTRequest): Promise<STTResponse> {
    return this.provider.transcribe(request);
  }

  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    return this.provider.synthesize(request);
  }
}
