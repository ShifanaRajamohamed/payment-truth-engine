export interface SpeechRecognitionConfig {
  locale: string;
  alternates?: string[];
  continuous: boolean;
}

export interface TextToSpeechConfig {
  locale: string;
  voiceGender: 'female' | 'male' | 'neutral';
  rate: number;
  pitch: number;
}

export interface SupportedLanguage {
  code: string;
  locale: string;
  name: string;
  nativeName: string;
  script: string;
  stt: SpeechRecognitionConfig;
  tts: TextToSpeechConfig;
  fallback: string;
}
