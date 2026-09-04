"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SarvamProvider = void 0;
class SarvamProvider {
    name = 'SarvamProvider';
    apiKey;
    baseUrl = 'https://api.sarvam.ai';
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.SARVAM_API_KEY || '';
    }
    isAvailable() {
        return !!this.apiKey && this.apiKey.trim().length > 0;
    }
    async transcribe(request) {
        if (!this.isAvailable()) {
            // Graceful fallback for local development without active key
            return {
                transcript: 'Sarvam STT: Voice captured successfully (Local Mock Mode)',
                languageCode: request.languageCode || 'en-IN',
                confidence: 0.95
            };
        }
        try {
            // Sarvam STT REST API invocation
            const response = await fetch(`${this.baseUrl}/speech-to-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': this.apiKey
                },
                body: JSON.stringify({
                    audio: request.audioBase64,
                    language_code: request.languageCode || 'hi-IN',
                    model: 'saaras:v1'
                })
            });
            if (!response.ok) {
                throw new Error(`Sarvam STT error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return {
                transcript: data.transcript || '',
                languageCode: request.languageCode,
                confidence: data.confidence || 0.9
            };
        }
        catch (err) {
            console.warn('Sarvam STT call failed:', err.message);
            return {
                transcript: 'Voice recognition fallback response.',
                languageCode: request.languageCode,
                confidence: 0.5
            };
        }
    }
    async synthesize(request) {
        if (!this.isAvailable()) {
            return {
                audioBase64: '',
                mimeType: 'audio/wav',
                durationMs: 1500
            };
        }
        try {
            const response = await fetch(`${this.baseUrl}/text-to-speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': this.apiKey
                },
                body: JSON.stringify({
                    inputs: [request.text],
                    target_language_code: request.languageCode || 'hi-IN',
                    speaker: request.gender === 'male' ? 'meera' : 'amartya',
                    pitch: 0,
                    pace: request.speed || 1.0,
                    loudness: 1.5,
                    speech_sample_rate: 16000,
                    enable_preprocessing: true,
                    model: 'bulbul:v1'
                })
            });
            if (!response.ok) {
                throw new Error(`Sarvam TTS error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const audioBase64 = data.audios?.[0] || '';
            return {
                audioBase64,
                mimeType: 'audio/wav',
                durationMs: 2000
            };
        }
        catch (err) {
            console.warn('Sarvam TTS call failed:', err.message);
            return {
                audioBase64: '',
                mimeType: 'audio/wav'
            };
        }
    }
}
exports.SarvamProvider = SarvamProvider;
