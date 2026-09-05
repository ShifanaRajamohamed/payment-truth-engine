import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TruthIncidentService } from './truth-incident.service';
import { PaymentIncident } from '@deepaudit/shared-types';
import { firstValueFrom } from 'rxjs';

export interface VoiceLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

@Injectable({ providedIn: 'root' })
export class VoiceResolverService {
  private readonly apiUrl = 'http://localhost:3000/api';

  readonly availableLanguages: VoiceLanguage[] = [
    { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    { code: 'tanglish', name: 'Tanglish', nativeName: 'தமிழ் / English', flag: '🇮🇳' },
    { code: 'en-IN', name: 'English (India)', nativeName: 'English', flag: '🌐' },
    { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  ];

  readonly currentLanguage = signal<VoiceLanguage>(this.availableLanguages[0]);
  readonly isListening = signal<boolean>(false);
  readonly isProcessing = signal<boolean>(false);
  readonly isSpeaking = signal<boolean>(false);
  readonly transcript = signal<string>('');
  readonly aiSpeechText = signal<string>('');
  readonly audioVolumeLevel = signal<number>(0);
  readonly lastInvestigatedIncident = signal<PaymentIncident | null>(null);

  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private synth: SpeechSynthesis | null = null;

  constructor(
    private http: HttpClient,
    private truthService: TruthIncidentService,
  ) {
    this.initSpeechRecognition();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  setLanguage(langCode: string): void {
    const lang = this.availableLanguages.find(l => l.code === langCode);
    if (lang) {
      this.currentLanguage.set(lang);
      if (this.recognition) {
        this.recognition.lang = langCode === 'tanglish' ? 'ta-IN' : langCode;
      }
    }
  }

  private initSpeechRecognition(): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ta-IN';

      this.recognition.onstart = () => {
        this.isListening.set(true);
        this.startVisualizer();
      };

      this.recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        this.transcript.set(currentText);
      };

      this.recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        this.isListening.set(false);
        this.stopVisualizer();
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
        this.stopVisualizer();
        const finalQuery = this.transcript();
        if (finalQuery.trim().length > 3) {
          this.processVoiceQuery(finalQuery);
        }
      };
    }
  }

  startListening(): void {
    this.transcript.set('');
    this.aiSpeechText.set('');
    if (this.recognition) {
      try {
        this.recognition.lang = this.currentLanguage().code === 'tanglish' ? 'ta-IN' : this.currentLanguage().code;
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition start exception, resetting:', e);
        this.recognition.stop();
        setTimeout(() => this.recognition.start(), 200);
      }
    } else {
      // Demo simulated mic pulse if browser doesn't have Web Speech API
      this.isListening.set(true);
      this.startVisualizer();
      setTimeout(() => {
        this.transcript.set('நான் ₹12,499 payment பண்ணிட்டேன், ஆனால் website இன்னும் payment pending என்று காட்டுது.');
        this.isListening.set(false);
        this.stopVisualizer();
        this.processVoiceQuery(this.transcript());
      }, 3000);
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening.set(false);
    this.stopVisualizer();
  }

  async processVoiceQuery(queryText: string): Promise<PaymentIncident> {
    this.isProcessing.set(true);
    this.transcript.set(queryText);

    try {
      const incident = await this.truthService.investigate({
        complaintText: queryText,
        language: this.currentLanguage().code,
      });

      this.lastInvestigatedIncident.set(incident);
      
      // Determine spoken response text based on selected language
      let speechText = '';
      const lang = this.currentLanguage().code;
      if (incident.aiAnalysis?.voiceScript) {
        if (lang === 'ta-IN') speechText = incident.aiAnalysis.voiceScript.tamil;
        else if (lang === 'tanglish') speechText = incident.aiAnalysis.voiceScript.tanglish;
        else if (lang === 'hi-IN') speechText = incident.aiAnalysis.voiceScript.hindi;
        else speechText = incident.aiAnalysis.voiceScript.english;
      } else {
        speechText = `Payment of ₹${incident.amount} was captured successfully. Webhook delivery failure identified. Safe state repair is ready.`;
      }

      this.aiSpeechText.set(speechText);
      this.speakText(speechText, lang);

      return incident;
    } finally {
      this.isProcessing.set(false);
    }
  }

  speakText(text: string, langCode: string = 'en-IN'): void {
    if (!text) return;
    if (this.synth) {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode === 'tanglish' ? 'ta-IN' : langCode;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => this.isSpeaking.set(true);
      utterance.onend = () => this.isSpeaking.set(false);
      utterance.onerror = () => this.isSpeaking.set(false);

      this.synth.speak(utterance);
    }
  }

  stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking.set(false);
  }

  private startVisualizer(): void {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.micStream = stream;
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!this.isListening()) return;
        this.analyser?.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        this.audioVolumeLevel.set(Math.min(100, Math.round((avg / 255) * 100)));
        requestAnimationFrame(updateVolume);
      };
      updateVolume();
    }).catch(() => {
      // Simulate pulsating visualizer if mic permission denied
      const interval = setInterval(() => {
        if (!this.isListening()) {
          clearInterval(interval);
          this.audioVolumeLevel.set(0);
          return;
        }
        this.audioVolumeLevel.set(Math.floor(20 + Math.random() * 60));
      }, 100);
    });
  }

  private stopVisualizer(): void {
    this.audioVolumeLevel.set(0);
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
