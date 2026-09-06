import { Observable, Subject } from 'rxjs';
import { SpeechProvider, SpeechErrorCode } from '../speech-provider.interface';

const TTS_LOCALE_CHAIN: Record<string, string[]> = {
  en: ['en-IN', 'en-GB', 'en-US'],
  ta: ['ta-IN', 'hi-IN', 'en-IN'],
  te: ['te-IN', 'hi-IN', 'en-IN'],
  kn: ['kn-IN', 'hi-IN', 'en-IN'],
  ml: ['ml-IN', 'hi-IN', 'en-IN'],
  hi: ['hi-IN', 'en-IN'],
  bn: ['bn-IN', 'bn-BD', 'hi-IN', 'en-IN'],
  mr: ['mr-IN', 'hi-IN', 'en-IN'],
  gu: ['gu-IN', 'hi-IN', 'en-IN'],
  pa: ['pa-IN', 'hi-IN', 'en-IN'],
  or: ['or-IN', 'hi-IN', 'en-IN'],
  as: ['as-IN', 'bn-IN', 'hi-IN', 'en-IN'],
  mai: ['hi-IN', 'en-IN'],
  ur: ['ur-IN', 'hi-IN', 'en-IN'],
  ks: ['ur-IN', 'hi-IN', 'en-IN'],
  sd: ['hi-IN', 'en-IN'],
  ne: ['ne-NP', 'hi-IN', 'en-IN'],
  sa: ['hi-IN', 'en-IN'],
  kok: ['hi-IN', 'en-IN'],
  mni: ['bn-IN', 'hi-IN', 'en-IN'],
  brx: ['hi-IN', 'en-IN'],
  doi: ['hi-IN', 'en-IN'],
  sat: ['hi-IN', 'en-IN'],
};

export class WebSpeechProvider implements SpeechProvider {

  private recognition: any = null;
  private synth = window.speechSynthesis;
  private cancelled = false;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private voicesReady: Promise<void>;

  constructor() {
    this.voicesReady = this.waitForVoices();
  }

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
    this.recognition.continuous = true;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += (final ? ' ' : '') + transcript;
        else interim += transcript;
      }
      subject.next((final + (interim ? (final ? ' ' : '') + interim : '')).trim());
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        subject.complete();
        return;
      }
      subject.error(this._mapError(event.error));
    };

    this.recognition.onend = () => subject.complete();

    try {
      this.recognition.start();
    } catch {
      subject.error('UNKNOWN' as SpeechErrorCode);
    }

    return subject.asObservable();
  }

  stopListening(): void {
    try { this.recognition?.stop(); } catch { /* already stopped */ }
    this.recognition = null;
  }

  async speak(
    text: string,
    locale: string,
    voiceGender: 'female' | 'male' | 'neutral',
    rate: number,
    pitch: number
  ): Promise<void> {
    if (!this.synth) return;
    this.cancelled = false;
    this.synth.cancel();
    await this.voicesReady;
    const chunks = this.chunkForSpeech(text);
    if (!chunks.length) return;
    const voice = this.pickVoice(locale, voiceGender);
    this.startKeepAlive();
    try {
      for (const chunk of chunks) {
        if (this.cancelled) break;
        await this.speakChunk(chunk, locale, voice, rate, pitch);
      }
    } finally {
      this.stopKeepAlive();
    }
  }

  cancelSpeech(): void {
    this.cancelled = true;
    this.stopKeepAlive();
    try { this.synth?.cancel(); } catch { /* ignore */ }
  }

  private waitForVoices(): Promise<void> {
    return new Promise(resolve => {
      if (!this.synth) { resolve(); return; }
      if (this.synth.getVoices().length > 0) { resolve(); return; }
      const finish = () => resolve();
      this.synth.addEventListener('voiceschanged', finish, { once: true });
      setTimeout(finish, 2000);
    });
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (this.cancelled || !this.synth.speaking) return;
      this.synth.pause();
      this.synth.resume();
    }, 8000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private sanitize(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*_#>`]+/g, ' ')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private chunkForSpeech(text: string): string[] {
    const clean = this.sanitize(text);
    if (!clean) return [];
    const sentences = clean.split(/(?<=[\.!\?।॥;:])\s+/);
    const chunks: string[] = [];
    let buf = '';
    for (const sentence of sentences) {
      const next = buf ? `${buf} ${sentence}` : sentence;
      if (next.length > 160 && buf) {
        chunks.push(buf);
        buf = sentence;
      } else {
        buf = next;
      }
    }
    if (buf) chunks.push(buf);
    const sized: string[] = [];
    for (const chunk of chunks) {
      if (chunk.length <= 180) { sized.push(chunk); continue; }
      let rest = chunk;
      while (rest.length > 180) {
        let cut = rest.lastIndexOf(' ', 180);
        if (cut < 40) cut = 180;
        sized.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      if (rest) sized.push(rest);
    }
    return sized.filter(Boolean);
  }

  private pickVoice(locale: string, gender: 'female' | 'male' | 'neutral'): SpeechSynthesisVoice | null {
    const voices = this.synth.getVoices();
    if (!voices.length) return null;
    const langKey = (locale.split('-')[0] || 'en').toLowerCase();
    const chain = [locale, ...(TTS_LOCALE_CHAIN[langKey] || ['hi-IN', 'en-IN', 'en-US'])];
    const genderMatch = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase();
      if (gender === 'neutral') return true;
      if (gender === 'female') return n.includes('female') || n.includes('woman') || n.includes('zira') || n.includes('heera') || n.includes('google');
      return n.includes('male') || n.includes('man') || n.includes('david') || n.includes('ravi');
    };
    for (const code of chain) {
      const prefix = code.toLowerCase();
      const exact = voices.find(v => v.lang.toLowerCase() === prefix && genderMatch(v))
        ?? voices.find(v => v.lang.toLowerCase() === prefix);
      if (exact) return exact;
      const starts = voices.find(v => v.lang.toLowerCase().startsWith(prefix.split('-')[0]) && genderMatch(v))
        ?? voices.find(v => v.lang.toLowerCase().startsWith(prefix.split('-')[0]));
      if (starts) return starts;
    }
    return voices.find(v => v.lang.toLowerCase().startsWith('en')) ?? voices[0];
  }

  private speakChunk(
    text: string,
    locale: string,
    voice: SpeechSynthesisVoice | null,
    rate: number,
    pitch: number
  ): Promise<void> {
    return new Promise(resolve => {
      if (this.cancelled) { resolve(); return; }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voice?.lang || locale;
      utterance.rate = Math.min(Math.max(rate, 0.7), 1.15);
      utterance.pitch = pitch;
      if (voice) utterance.voice = voice;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(safety);
        resolve();
      };
      const safety = setTimeout(finish, Math.min(45000, Math.max(8000, text.length * 95)));
      utterance.onend = finish;
      utterance.onerror = () => finish();
      try {
        if (this.synth.paused) this.synth.resume();
        this.synth.speak(utterance);
      } catch {
        finish();
      }
    });
  }

  private _mapError(error: string): SpeechErrorCode {
    switch (error) {
      case 'not-allowed': return 'MIC_DENIED';
      case 'no-speech':   return 'NO_SPEECH';
      case 'network':     return 'NETWORK';
      case 'aborted':     return 'ABORTED';
      default:            return 'UNKNOWN';
    }
  }
}
