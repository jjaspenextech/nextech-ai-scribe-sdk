import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { ScribeService } from './scribe.service';
import { ScribeApiService } from '../scribe-api/scribe-api.service';
import { SpeechToTextService, StreamingStatus } from '../speech-to-text/speechToText.service';
import { GenericMappingService } from '../mapper/mapping.service';
import { ClassificationResult } from '../../models/api';
import { CLASSIFICATION_STRATEGY_MANAGER_FACTORY } from '../../strategies/classification-strategy.manager';
import { SCRIBE_SCHEMA_DEF, SCRIBE_INITIAL_CHUNKS, SCRIBE_INITIAL_STATE } from '../../config/scribe-engine.config';

// Mock classes for dependencies
class MockSpeechToTextService {
  streamingStatus$ = new BehaviorSubject<StreamingStatus>(StreamingStatus.NotStarted);
  recognizedSpeech$ = new Subject();
  startSpeechRecognizer = jasmine.createSpy('startSpeechRecognizer');
  stopSpeechRecognizer = jasmine.createSpy('stopSpeechRecognizer');
  loadSDK = jasmine.createSpy('loadSDK');
}

class MockMappingService {
  mapAllData = jasmine.createSpy('mapAllData').and.returnValue({});
  mapData = jasmine.createSpy('mapData').and.returnValue({});
}

class MockScribeApiService {
  initializeConversation = jasmine.createSpy('initializeConversation')
    .and.returnValue(Promise.resolve('mock-conversation-guid'));
  getSectionsPresent = jasmine.createSpy('getSectionsPresent')
    .and.returnValue(Promise.resolve({ updatedFlags: { section1: true, section2: false } }));
  classifyConversation = jasmine.createSpy('classifyConversation')
    .and.returnValue(Promise.resolve({
      classification: { section1: { data: 'test' } },
      sections_present: { section1: true }
    }));
  cleanupConversation = jasmine.createSpy('cleanupConversation')
    .and.returnValue(Promise.resolve());
}

// Mock schema definition for testing
const mockSchemaDefinition = [
  {
    TestSchema: {
      type: 'object',
      properties: {
        simpleProperty: {
          type: 'string'
        }
      }
    }
  }
];

// Mock initial chunks for testing
const mockInitialChunks = [
  'This is a test chunk'
];

// Mock initial state for testing
const mockInitialState = {
  testSection: {
    testProperty: 'Test Value'
  }
};

describe('ScribeService', () => {
  let service: ScribeService;
  let mockSpeechToTextService: MockSpeechToTextService;
  let mockMappingService: MockMappingService;
  let mockScribeApiService: MockScribeApiService;
  let mockClassificationManager: any;
  
  beforeEach(() => {
    mockSpeechToTextService = new MockSpeechToTextService();
    mockMappingService = new MockMappingService();
    mockScribeApiService = new MockScribeApiService();
    
    // Create a simple mock object with spies
    mockClassificationManager = {
      setStrategy: jasmine.createSpy('setStrategy'),
      handleChunk: jasmine.createSpy('handleChunk'),
      cleanup: jasmine.createSpy('cleanup'),
      classificationResults$: new Subject<Record<string, any>>()
    };

    TestBed.configureTestingModule({
      providers: [
        ScribeService,
        { provide: SpeechToTextService, useValue: mockSpeechToTextService },
        { provide: GenericMappingService, useValue: mockMappingService },
        { provide: ScribeApiService, useValue: mockScribeApiService },
        { provide: SCRIBE_SCHEMA_DEF, useValue: mockSchemaDefinition },
        { provide: SCRIBE_INITIAL_CHUNKS, useValue: mockInitialChunks },
        { provide: SCRIBE_INITIAL_STATE, useValue: mockInitialState },
        {
          provide: CLASSIFICATION_STRATEGY_MANAGER_FACTORY,
          useValue: () => mockClassificationManager
        }
      ]
    });

    service = TestBed.inject(ScribeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(mockClassificationManager.setStrategy).toHaveBeenCalledWith('sequential');
  });

  describe('initializeConversation', () => {
    it('should initialize conversation with doctor GUID', async () => {
      const doctorGuid = 'test-doctor-guid';
      
      await service.initializeConversation();
      
      expect(mockScribeApiService.initializeConversation).toHaveBeenCalled();
      expect(service['conversationGuid']).toBe('mock-conversation-guid');
      expect(service['_isInitialized$'].value).toBe(true);
    });

    it('should handle initialization errors', async () => {
      const doctorGuid = 'test-doctor-guid';
      const error = new Error('Test error');
      
      mockScribeApiService.initializeConversation.and.returnValue(Promise.reject(error));
      
      spyOn(console, 'error');
      
      await expectAsync(service.initializeConversation()).toBeRejected();
      expect(console.error).toHaveBeenCalled();
      expect(service['_isInitialized$'].value).toBe(false);
    });
  });

  describe('toggleRecording', () => {
    it('should start recording if not currently listening', async () => {
      mockSpeechToTextService.streamingStatus$.next(StreamingStatus.NotStarted);
      
      await service.toggleRecording();
      
      expect(mockSpeechToTextService.startSpeechRecognizer).toHaveBeenCalled();
      expect(mockSpeechToTextService.stopSpeechRecognizer).not.toHaveBeenCalled();
    });

    it('should stop recording if currently listening', async () => {
      mockSpeechToTextService.streamingStatus$.next(StreamingStatus.Recording);
      
      await service.toggleRecording();
      
      expect(mockSpeechToTextService.stopSpeechRecognizer).toHaveBeenCalled();
      expect(mockSpeechToTextService.startSpeechRecognizer).not.toHaveBeenCalled();
    });
  });

  describe('recording duration timer', () => {
    it('should start timer when recording starts', fakeAsync(() => {
      mockSpeechToTextService.streamingStatus$.next(StreamingStatus.Recording);
      
      tick(1000);
      expect(service['recordingDuration$'].value).toBe('00:01');
      
      tick(1000);
      expect(service['recordingDuration$'].value).toBe('00:02');
      
      // Cleanup
      mockSpeechToTextService.streamingStatus$.next(StreamingStatus.Stopped);
    }));

    it('should reset timer when recording stops', fakeAsync(() => {
      mockSpeechToTextService.streamingStatus$.next(StreamingStatus.Recording);
      
      tick(5000);
      expect(service['recordingDuration$'].value).toBe('00:05');
      
      mockSpeechToTextService.streamingStatus$.next(StreamingStatus.Stopped);
      expect(service['recordingDuration$'].value).toBe('00:00');
    }));

    it('should format duration properly into minutes and seconds', fakeAsync(() => {
      mockSpeechToTextService.streamingStatus$.next(StreamingStatus.Recording);
      
      tick(65000); // 1 minute and 5 seconds
      expect(service['recordingDuration$'].value).toBe('01:05');
      
      // Cleanup
      mockSpeechToTextService.streamingStatus$.next(StreamingStatus.Stopped);
    }));
  });

  describe('speech recognition', () => {
    it('should handle recognized speech', () => {
      const testText = 'This is a test';
      
      mockSpeechToTextService.recognizedSpeech$.next({ text: testText, timestamp: Date.now() });
      
      expect(mockClassificationManager.handleChunk).toHaveBeenCalledWith(testText);
    });

    it('should not process empty speech', () => {
      mockSpeechToTextService.recognizedSpeech$.next({ text: '', timestamp: Date.now() });
      
      expect(mockClassificationManager.handleChunk).not.toHaveBeenCalled();
    });

    it('should not process duplicate speech', () => {
      const testText = 'This is a test';
      
      mockSpeechToTextService.recognizedSpeech$.next({ text: testText, timestamp: Date.now() });
      mockSpeechToTextService.recognizedSpeech$.next({ text: testText, timestamp: Date.now() + 100 });
      
      expect(mockClassificationManager.handleChunk).toHaveBeenCalledTimes(1);
    });
  });

  describe('processChunk', () => {
    beforeEach(async () => {
      // Initialize the service
      await service.initializeConversation();
    });
    
    it('should process a chunk and update medical chart', async () => {
      const mockClassificationResult: ClassificationResult = {
        classification: { section1: { data: 'test' } },
        sections_present: { section1: true }
      };

      const mockSectionsPresent = {
        updatedFlags: { section1: true, section2: false }
      };
      
      mockScribeApiService.getSectionsPresent.and.returnValue(Promise.resolve(mockSectionsPresent));
      mockScribeApiService.classifyConversation.and.returnValue(Promise.resolve(mockClassificationResult));
      
      // Call the private method directly
      await service.processChunk('test chunk', ['test chunk']);
      
      // Check that sections present was called with correct parameters
      expect(mockScribeApiService.getSectionsPresent).toHaveBeenCalledWith(
        'test chunk', 
        'mock-conversation-guid',
        1
      );

      // Check that classify conversation was called with the active sections
      expect(mockScribeApiService.classifyConversation).toHaveBeenCalledWith(
        'test chunk',
        ['section1'],
        'mock-conversation-guid',
        1
      );
      
      // Check mapping
      expect(mockMappingService.mapAllData).toHaveBeenCalled();
      
      // Check that classification results were updated
      expect(service['classificationResults$'].value).toEqual(mockClassificationResult);
    });

    it('should handle errors during sections present check and not call classify conversation', async () => {
      const error = new Error('Test error');
      mockScribeApiService.getSectionsPresent.and.returnValue(Promise.reject(error));
      
      spyOn(console, 'error');
      
      // Call the private method directly
      await service.processChunk('test chunk', ['test chunk']);
      
      expect(console.error).toHaveBeenCalled();
      expect(mockScribeApiService.classifyConversation).not.toHaveBeenCalled();
    });

    it('should handle errors during classification', async () => {
      const mockSectionsPresent = {
        updatedFlags: { section1: true }
      };
      
      const error = new Error('Test error');
      mockScribeApiService.getSectionsPresent.and.returnValue(Promise.resolve(mockSectionsPresent));
      mockScribeApiService.classifyConversation.and.returnValue(Promise.reject(error));
      
      spyOn(console, 'error');
      
      // Call the private method directly
      await service.processChunk('test chunk', ['test chunk']);
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('classifyChunk', () => {
    beforeEach(async () => {
      await service.initializeConversation();
    });

    it('should classify with provided sections', async () => {
      const mockClassificationResult: ClassificationResult = {
        classification: { section1: { data: 'test' } },
        sections_present: { section1: true }
      };
      
      mockScribeApiService.classifyConversation.and.returnValue(Promise.resolve(mockClassificationResult));
      
      // Call the private method directly with specific sections
      await (service as any).classifyChunk('test chunk', ['test chunk'], ['section1']);
      
      expect(mockScribeApiService.classifyConversation).toHaveBeenCalledWith(
        'test chunk',
        ['section1'],
        'mock-conversation-guid',
        1
      );
      
      expect(mockMappingService.mapAllData).toHaveBeenCalled();
    });

    it('should use all schema names when no sections provided', async () => {
      const mockClassificationResult: ClassificationResult = {
        classification: { section1: { data: 'test' } },
        sections_present: { section1: true }
      };
      
      mockScribeApiService.classifyConversation.and.returnValue(Promise.resolve(mockClassificationResult));
      
      // Call the private method directly without sections
      await (service as any).classifyChunk('test chunk', ['test chunk']);
      
      // Verify it used schema names from mockSchemaDefinition
      expect(mockScribeApiService.classifyConversation).toHaveBeenCalledWith(
        'test chunk',
        ['TestSchema'],
        'mock-conversation-guid',
        1
      );
    });
  });

  describe('getSectionsToClassify', () => {
    it('should extract active sections', async () => {
      const sectionFlags = {
        section1: true,
        section2: false,
        section3: true
      };
      
      const result = await (service as any).getSectionsToClassify(sectionFlags);
      
      expect(result).toEqual(['section1', 'section3']);
    });

    it('should handle null or undefined section flags', async () => {
      let result = await (service as any).getSectionsToClassify(null);
      expect(result).toEqual([]);
      
      result = await (service as any).getSectionsToClassify(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('handleClassificationResults', () => {
    it('should update medical chart and classified sections', () => {
      const mockResult = {
        classification: {
          section1: { data: 'test' }
        }
      };
      
      (service as any).handleClassificationResults(mockResult);
      
      expect(mockMappingService.mapAllData).toHaveBeenCalled();
      
      // Get the updated sections
      const updatedSections = (service as any).classifiedSectionsSubject.value;
      expect(updatedSections.length).toBe(1);
      expect(updatedSections[0].name).toBe('section1');
      expect(updatedSections[0].isNew).toBe(true);
    });

    it('should handle null or undefined results', () => {
      spyOn((service as any), 'updateClassifiedSections');
      
      (service as any).handleClassificationResults(null);
      expect(mockMappingService.mapAllData).not.toHaveBeenCalled();
      expect((service as any).updateClassifiedSections).not.toHaveBeenCalled();
      
      (service as any).handleClassificationResults(undefined);
      expect(mockMappingService.mapAllData).not.toHaveBeenCalled();
      expect((service as any).updateClassifiedSections).not.toHaveBeenCalled();
    });

    it('should handle results without classification', () => {
      spyOn((service as any), 'updateClassifiedSections');
      
      (service as any).handleClassificationResults({});
      expect(mockMappingService.mapAllData).not.toHaveBeenCalled();
      expect((service as any).updateClassifiedSections).not.toHaveBeenCalled();
    });
  });

  describe('updateClassifiedSections', () => {
    it('should add new sections', () => {
      const result = {
        section1: { data: 'test' }
      };
      
      (service as any).updateClassifiedSections(result);
      
      const sections = (service as any).classifiedSectionsSubject.value;
      expect(sections.length).toBe(1);
      expect(sections[0].name).toBe('section1');
      expect(sections[0].content).toEqual({ data: 'test' });
      expect(sections[0].isNew).toBe(true);
    });

    it('should update existing sections', () => {
      // First add a section
      (service as any).updateClassifiedSections({
        section1: { data: 'initial' }
      });
      
      // Then update it
      (service as any).updateClassifiedSections({
        section1: { data: 'updated' }
      });
      
      const sections = (service as any).classifiedSectionsSubject.value;
      expect(sections.length).toBe(1);
      expect(sections[0].name).toBe('section1');
      expect(sections[0].content).toEqual({ data: 'updated' });
      expect(sections[0].isNew).toBe(false); // No longer new
    });

    it('should handle null or undefined results', () => {
      const initialSections = (service as any).classifiedSectionsSubject.value;
      
      (service as any).updateClassifiedSections(null);
      expect((service as any).classifiedSectionsSubject.value).toEqual(initialSections);
      
      (service as any).updateClassifiedSections(undefined);
      expect((service as any).classifiedSectionsSubject.value).toEqual(initialSections);
    });
  });

  describe('cleanupConversation', () => {
    it('should clean up conversation', async () => {
      const conversationGuid = 'test-conversation-guid';
      
      await service.cleanupConversation(conversationGuid);
      
      expect(mockScribeApiService.cleanupConversation).toHaveBeenCalledWith(
        conversationGuid
      );
      expect(mockClassificationManager.cleanup).toHaveBeenCalled();
      expect(service['_isInitialized$'].value).toBe(false);
    });

    it('should handle cleanup errors', async () => {
      const conversationGuid = 'test-conversation-guid';
      const error = new Error('Test error');
      
      mockScribeApiService.cleanupConversation.and.returnValue(Promise.reject(error));
      
      spyOn(console, 'error');
      
      await expectAsync(service.cleanupConversation(conversationGuid)).toBeRejected();
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up resources', () => {
      service.ngOnDestroy();
      
      expect(mockClassificationManager.cleanup).toHaveBeenCalled();
    });
  });
}); 