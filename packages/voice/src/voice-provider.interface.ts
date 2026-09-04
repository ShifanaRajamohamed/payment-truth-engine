import { STTRequest, STTResponse, TTSRequest, TTSResponse } from '@deepaudit/shared-types';

export interface VoiceProvider {
  name: string;
  isAvailable(): boolean;
  transcribe(request: STTRequest): Promise<STTResponse>;
  synthesize(request: TTSRequest): Promise<TTSResponse>;
}
