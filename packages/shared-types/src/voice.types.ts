export interface STTRequest {
  audioBase64: string;
  mimeType: string;
  languageCode: string;
}

export interface STTResponse {
  transcript: string;
  languageCode: string;
  confidence: number;
}

export interface TTSRequest {
  text: string;
  languageCode: string;
  gender?: 'female' | 'male' | 'neutral';
  speed?: number;
}

export interface TTSResponse {
  audioBase64: string;
  mimeType: string;
  durationMs?: number;
}

export interface VoiceSessionState {
  sessionId: string;
  status: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';
  lastTranscript?: string;
  lastResponse?: string;
  languageCode: string;
}
