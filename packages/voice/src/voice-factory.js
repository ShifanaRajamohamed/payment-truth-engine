"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceProviderFactory = void 0;
const sarvam_provider_1 = require("./providers/sarvam.provider");
const mock_voice_provider_1 = require("./providers/mock-voice.provider");
class VoiceProviderFactory {
    static getProvider(preferredApiKey) {
        const sarvam = new sarvam_provider_1.SarvamProvider(preferredApiKey);
        if (sarvam.isAvailable()) {
            return sarvam;
        }
        return new mock_voice_provider_1.MockVoiceProvider();
    }
}
exports.VoiceProviderFactory = VoiceProviderFactory;
