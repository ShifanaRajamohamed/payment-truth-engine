"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockVoiceProvider = void 0;
class MockVoiceProvider {
    name = 'MockVoiceProvider';
    isAvailable() {
        return true;
    }
    async transcribe(request) {
        return {
            transcript: 'Status of high-value corporate disbursements this week',
            languageCode: request.languageCode || 'en-IN',
            confidence: 0.99
        };
    }
    async synthesize(request) {
        return {
            audioBase64: '',
            mimeType: 'audio/wav',
            durationMs: 1200
        };
    }
}
exports.MockVoiceProvider = MockVoiceProvider;
