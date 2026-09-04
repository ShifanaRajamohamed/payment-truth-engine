import { Observable, Subject } from 'rxjs';
import { SpeechProvider, SpeechErrorCode } from '../speech-provider.interface';

/**
 * WebSpeechProvider
 *
 * Implements SpeechProvider using the browser Web Speech API.
 * Works on Chrome and Edge. Firefox is not supported (graceful fallback via isSupported()).
 *
 * STT locale is passed in from LanguageService — never hardcoded here.
 * Swap for Sarvam/Bhashini: create a new provider, inject it in SpeechService.
 */
export class WebSpeechProvider implements SpeechProvider {

  private recognition: any = null;
  private synth = window.speechSynthesis;

  isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  startListening(locale: string): Observable<string> {
    const subject = new Subject<string>();

    if (!this.isSupported()) {
      setTimeout(() => subject.error('NOT_SUPPORTED' as SpeechErrorCode), 0);
      return subject.asObservable();
    }

    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognitionImpl();
    this.recognition.lang = locale;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.continuous = false;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      // Emit both so UI can show live transcript while listening
      subject.next(final || interim);
    };

    this.recognition.onerror = (event: any) => {
      const code = this._mapError(event.error);
      subject.error(code);
    };

    this.recognition.onend = () => subject.complete();

    try {
      this.recognition.start();
    } catch (e) {
      subject.error('UNKNOWN' as SpeechErrorCode);
    }

    return subject.asObservable();
  }

  stopListening(): void {
    this.recognition?.stop();
    this.recognition = null;
  }

  speak(text: string, locale: string, voiceGender: 'female' | 'male' | 'neutral', rate: number, pitch: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) { resolve(); return; }
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang  = locale;
      utterance.rate  = rate;
      utterance.pitch = pitch;

      // Try to find a voice matching locale + gender hint
      const voices = this.synth.getVoices();
      const preferred = voices.find(v =>
        v.lang.startsWith(locale.split('-')[0]) &&
        (voiceGender === 'neutral' || (voiceGender === 'female' ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') : v.name.toLowerCase().includes('male')))
      ) ?? voices.find(v => v.lang.startsWith(locale.split('-')[0]));

      if (preferred) utterance.voice = preferred;

      utterance.onend   = () => resolve();
      utterance.onerror = () => reject();

      this.synth.speak(utterance);
    });
  }

  cancelSpeech(): void {
    this.synth?.cancel();
  }

  private _mapError(error: string): SpeechErrorCode {
    switch (error) {
      case 'not-allowed':      return 'MIC_DENIED';
      case 'no-speech':        return 'NO_SPEECH';
      case 'network':          return 'NETWORK';
      case 'aborted':          return 'ABORTED';
      default:                 return 'UNKNOWN';
    }
  }
}
