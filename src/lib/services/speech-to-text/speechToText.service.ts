import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SpeechRecognitionEvent } from '../../models/speech-recognition-event';
import { SPEECH_SILENCE_TIMEOUT_MS } from '../../config/scribe-engine.config';
import { ScribeApiService } from '../scribe-api/scribe-api.service';

export enum StreamingStatus {
  NotStarted = 'not-started',
  Recording = 'recording',
  Stopped = 'stopped',
  Error = 'error'
}

// This is a wrapper class for the Microsoft Speech SDK for testing purposes
@Injectable({
  providedIn: 'root'
})
export class MicrosoftSpeechSDK {
  SpeechConfig = {} as any;
  SpeechRecognizer = {} as any;
  AudioConfig = {} as any;
  PropertyId = {} as any;
}

@Injectable({
  providedIn: 'root'
})
export class SpeechToTextService {
  private destroy$ = new Subject<void>();
  private speechRecognizer: any | null = null;
  private recognizedSpeechSubject = new Subject<SpeechRecognitionEvent>();
  public recognizedSpeech$ = this.recognizedSpeechSubject
    .asObservable();
  private _streamingStatus$ = new BehaviorSubject<StreamingStatus>(StreamingStatus.NotStarted);
  public streamingStatus$ = this._streamingStatus$.asObservable();
  private speechSDK: MicrosoftSpeechSDK | null = null;
  private silenceTimeoutMs: number = inject(SPEECH_SILENCE_TIMEOUT_MS);
  private apiService = inject(ScribeApiService);

  public loadSDK() {
    if (!!(window as any).SpeechSDK) {
      this.speechSDK = (window as any).SpeechSDK as any;
      console.log('Speech SDK loaded');
    } else {
      console.error('Speech SDK not loaded');
    }
  }

  public async startSpeechRecognizer() {
    console.log('Starting classification speech recognizer');
    const tokenResponse = await this.apiService.getSttToken();
    
    if (!tokenResponse?.error && this.speechSDK && !this.speechRecognizer) {
      const audioConfig = this.speechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const speechConfig = this.speechSDK.SpeechConfig.fromAuthorizationToken(tokenResponse.token, tokenResponse.region);
      speechConfig.setProperty(this.speechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs, this.silenceTimeoutMs.toString());
      this.speechRecognizer = new this.speechSDK.SpeechRecognizer(speechConfig, audioConfig);
    }

    this.speechRecognizer.recognized = (s: unknown, e: any) => {
      if (e.result.text && e.result.text.trim()) {
        const recognizedText = e.result.text;
        this.recognizedSpeechSubject.next({
          text: recognizedText,
          timestamp: Date.now()
        });
      }
    };

    await this.speechRecognizer.startContinuousRecognitionAsync(
      () => {
        this._streamingStatus$.next(StreamingStatus.Recording);
      },
      (error: string) => {
        console.error('Error starting classification recognition:', error);
        this._streamingStatus$.next(StreamingStatus.Error);
      }
    );
  }

  public async stopSpeechRecognizer() {
    try {
      if (this.speechRecognizer) {
        await this.speechRecognizer.stopContinuousRecognitionAsync(
          () => {
            this._streamingStatus$.next(StreamingStatus.Stopped);
            this.speechRecognizer?.close();
            this.speechRecognizer = null;
          },
          (error: string) => {
            console.error('Error stopping classification recognition:', error);
            this._streamingStatus$.next(StreamingStatus.Error);
            this.speechRecognizer?.close();
            this.speechRecognizer = null;
          }
        );
      }
    } catch (error) {
      console.error('Error stopping classification streaming recognition:', error);
      if (this.speechRecognizer) {
        this.speechRecognizer.close();
        this.speechRecognizer = null;
      }
      this._streamingStatus$.next(StreamingStatus.Error);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
