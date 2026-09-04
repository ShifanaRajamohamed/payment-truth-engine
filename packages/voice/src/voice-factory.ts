import { VoiceProvider } from './voice-provider.interface';
import { SarvamProvider } from './providers/sarvam.provider';

export class VoiceProviderFactory {
  static getProvider(preferredApiKey?: string): VoiceProvider {
    return new SarvamProvider(preferredApiKey);
  }
}
