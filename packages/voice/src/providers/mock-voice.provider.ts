import { STTRequest, STTResponse, TTSRequest, TTSResponse } from '@deepaudit/shared-types';
import { VoiceProvider } from '../voice-provider.interface';

export class MockVoiceProvider implements VoiceProvider {
  readonly name = 'MockVoiceProvider';

  isAvailable(): boolean {
    return true;
  }

  async transcribe(request: STTRequest): Promise<STTResponse> {
    return {
      transcript: 'Status of high-value corporate disbursements this week',
      languageCode: request.languageCode || 'en-IN',
      confidence: 0.99
    };
  }

  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    return {
      audioBase64: '',
      mimeType: 'audio/wav',
      durationMs: 1200
    };
  }
}
