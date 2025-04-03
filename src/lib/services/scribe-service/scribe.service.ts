import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Subject, filter, distinctUntilChanged, map, takeUntil, interval,
   take, tap } from 'rxjs';
import { ScribeApiService } from '../scribe-api/scribe-api.service';
import { SpeechToTextService, StreamingStatus } from '../speech-to-text/speechToText.service';
import { SpeechRecognitionEvent } from '../../models/speech-recognition-event';
import { GenericMappingService } from '../mapper/mapping.service';
import { SCRIBE_INITIAL_CHUNKS, SCRIBE_INITIAL_STATE, SCRIBE_SCHEMA_DEF, DEFAULT_INITIAL_STATE, DEFAULT_INITIAL_CHUNKS } from '../../config/scribe-engine.config';
import { ClassificationStrategyManager, CLASSIFICATION_STRATEGY_MANAGER_FACTORY } from '../../strategies/classification-strategy.manager';
import { ClassificationResult } from '../scribe-api/scribe-api.service';
import { ClassificationData } from '../../models/models';
@Injectable({
  providedIn: 'root'
})
export class ScribeService {
  private speechToTextService: SpeechToTextService = inject(SpeechToTextService);
  private mappingService: GenericMappingService = inject(GenericMappingService);
  private scribeApiService: ScribeApiService = inject(ScribeApiService);
  private schemaDefinition = inject(SCRIBE_SCHEMA_DEF);
  private initialChunks = inject(SCRIBE_INITIAL_CHUNKS, { optional: true }) ?? DEFAULT_INITIAL_CHUNKS;
  private initialState = inject(SCRIBE_INITIAL_STATE, { optional: true }) ?? DEFAULT_INITIAL_STATE;
  private strategyManager: ClassificationStrategyManager;
  
  private destroy$ = new Subject<void>();
  public _isInitialized$ = new BehaviorSubject<boolean>(false);
  public classificationResults$ = new BehaviorSubject<ClassificationResult | null>(null);
  private _classificationData = new BehaviorSubject<ClassificationData>(this.initialState);
  public classificationData$ = this._classificationData.asObservable();
  public isListening$ = this.speechToTextService.streamingStatus$.pipe(
    map((status: StreamingStatus) => status === StreamingStatus.Recording)
  );
  private timerStop$ = new Subject<void>();
  private recordingStartTime: number | null = null;
  public recordingDuration$ = new BehaviorSubject<string>('00:00');
  public doctorGuid: string = "";
  private conversationGuid: string = "";
  private $recognizedSpeechSubject = this.speechToTextService.recognizedSpeech$;
  private schemaNames = this.schemaDefinition.map(schema => Object.keys(schema)[0]);
  
  // First create a BehaviorSubject with initial empty array
  private classifiedSectionsSubject = new BehaviorSubject<{ name: string, content: string, expanded: boolean, isNew: boolean }[]>([]);
  
  // Then expose it as an Observable
  public classifiedSections$ = this.classifiedSectionsSubject.asObservable();

  constructor() {
    const createStrategyManager = inject(CLASSIFICATION_STRATEGY_MANAGER_FACTORY);
    this.strategyManager = createStrategyManager(
      (chunk: string, chunks: string[]) => this.classifyChunk(chunk, chunks)
    );

    // Set initial strategy
    this.strategyManager.setStrategy('sequential');

    this.$recognizedSpeechSubject
    .pipe(
      filter((event: SpeechRecognitionEvent) => event.text.trim() !== ''),
      distinctUntilChanged((prev, curr) => prev.text === curr.text)
    )
    .subscribe(event => this.handleRecognizedSpeech(event.text));

    this.isListening$
    .pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    )
    .subscribe(isListening => {
      if (!isListening) {
        this.timerStop$.next();
        this.recordingStartTime = null;
        this.recordingDuration$.next('00:00');
      } else {
        this.recordingStartTime = Date.now();
        interval(1000)
          .pipe(
            takeUntil(this.timerStop$)
          )
          .subscribe(() => {
            if (this.recordingStartTime) {
              const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
              const minutes = Math.floor(duration / 60);
              const seconds = duration % 60;
              this.recordingDuration$.next(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
          });
      }
    });

    this.classificationResults$
    .pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    )
    .subscribe(result => {
      this.handleClassificationResults(result);
    });

    // this.mappingService.parseSchemas(this.schemaDefinition);
    this._classificationData.next(this.initialState);
  }

  async initializeConversation(doctorGuid: string): Promise<void> {
    try {
      this.doctorGuid = doctorGuid;
      this.speechToTextService.loadSDK();
      this.conversationGuid = await this.scribeApiService.initializeConversation(doctorGuid);
      this._isInitialized$.next(true);
      // for quick testing, do not commit this uncommented
      for (const chunk of this.initialChunks) {
        this.strategyManager.handleChunk(chunk);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      throw error;
    }
  }

  async toggleRecording(): Promise<void> {
    this.isListening$
    .pipe(
      take(1),
      tap((isListening: boolean) => {
        if (!isListening) {
          this.speechToTextService.startSpeechRecognizer();
        } else {
          this.speechToTextService.stopSpeechRecognizer();
        }
      })
    )
    .subscribe();
  }

  private handleRecognizedSpeech(chunk: string) {
    this.strategyManager.handleChunk(chunk);
  }

  public async classifyChunk(chunk: string, chunks: string[], sectionsToClassify: string[] | null = null): Promise<void> {
    try {
      const fullConversation = chunks.join(' ');
      const sequenceNumber = chunks.length;

      if (!sectionsToClassify) {
        sectionsToClassify = [...this.schemaNames];
      }
      
      const result = await this.scribeApiService.classifyConversation(
        fullConversation, 
        sectionsToClassify, 
        this.doctorGuid,
        this.conversationGuid,
        sequenceNumber
      );

      if (result) {
        this.classificationResults$.next(result);
      }
    } catch (error) {
      console.error('Error processing chunk:', error);
    }
  }

  public async sectionPresentsChunk(chunk: string, sequenceNumber: number): Promise<Record<string, boolean>> {
    try {
      const sections = await this.scribeApiService.getSectionsPresent(
        chunk, 
        this.doctorGuid, 
        this.conversationGuid,
        sequenceNumber
      );

      return sections?.updatedFlags || {};
    } catch (error) {
      console.error('Error checking sections present:', error);
      return {};
    }
  }

  public async processChunk(chunk: string, chunks: string[]): Promise<void> {
    const sectionsPresent = await this.sectionPresentsChunk(chunk, chunks.length);
    const sectionsToClassify = await this.getSectionsToClassify(sectionsPresent);
    if (sectionsToClassify.length > 0) {
      await this.classifyChunk(chunk, chunks, sectionsToClassify);
    }
  }

  private async getSectionsToClassify(newSectionFlags: Record<string, boolean> | null | undefined): Promise<string[]> {
    if (!newSectionFlags) {
      return [];
    }
    
    const sectionsToClassify: string[] = Object.entries(newSectionFlags)
      .filter(([flag, value]) => value)
      .map(([flag]) => flag);
    return sectionsToClassify;
  }

  private handleClassificationResults(result: ClassificationResult | null | undefined){
    if (!result || !result['classification']) return;
    const classification = result['classification'];
    
    const updatedMedicalChart = this.mappingService.mapAllData(classification, this._classificationData.value);
    console.log('updatedMedicalChart', updatedMedicalChart);
    this._classificationData.next(updatedMedicalChart);
    this.updateClassifiedSections(classification);
  }

  private updateClassifiedSections(result: Record<string,any> | null | undefined) {
    if (!result) return;
    
    const previousSections = this.classifiedSectionsSubject.value;
    let updatedSections = [...previousSections];
    
    Object.entries(result).forEach(([sectionName, sectionContent]) => {
      const existingSection = updatedSections.find(section => section.name === sectionName);
      if (existingSection) {
        const sectionIndex = updatedSections.findIndex(section => section.name === sectionName);
        updatedSections[sectionIndex] = { 
          ...existingSection, 
          content: sectionContent, 
          isNew: false 
        };
      } else if (sectionContent) {  // Only add if there is actual content
        updatedSections = [...updatedSections, { 
          name: sectionName, 
          content: sectionContent, 
          expanded: false, 
          isNew: true 
        }];
      }
    });
    
    this.classifiedSectionsSubject.next(updatedSections);
  }

  async cleanupConversation(conversationGuid: string): Promise<void> {
    try {
      this.strategyManager.cleanup();
      await this.scribeApiService.cleanupConversation(conversationGuid, this.doctorGuid);
      this._isInitialized$.next(false);
    } catch (error) {
      console.error('Error cleaning up conversation:', error);
      throw error;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.strategyManager.cleanup();
  }
} 