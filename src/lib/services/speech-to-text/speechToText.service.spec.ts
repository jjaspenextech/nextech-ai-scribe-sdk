import { TestBed } from '@angular/core/testing';
import { MicrosoftSpeechSDK, SpeechToTextService, StreamingStatus } from './speechToText.service';
import { firstValueFrom } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { SPEECH_SILENCE_TIMEOUT_MS } from '../../config/scribe-engine.config';
import { ScribeApiService } from '../scribe-api/scribe-api.service';

describe('SpeechToTextService', () => {
  let service: SpeechToTextService;
  let mockRecognizer: any;
  let mockSpeechSdk: any;
  let consoleErrorSpy: jasmine.Spy;
  let consoleLogSpy: jasmine.Spy;
  let originalSpeechSDK: any;

  // Increase timeout for async tests
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

  beforeEach(() => {
    // Spy on console.error and console.log
    consoleErrorSpy = spyOn(console, 'error');
    consoleLogSpy = spyOn(console, 'log');

    // Store original window.SpeechSDK if it exists
    originalSpeechSDK = (window as any).SpeechSDK;

    // Create a mock recognizer with event emitter functionality
    mockRecognizer = {
      startContinuousRecognitionAsync: jasmine.createSpy('startContinuousRecognitionAsync')
        .and.callFake((success: () => void) => {
          // Call success callback immediately
          success();
        }),
      stopContinuousRecognitionAsync: jasmine.createSpy('stopContinuousRecognitionAsync')
        .and.callFake((success: () => void) => {
          // Call success callback immediately
          success();
        }),
      close: jasmine.createSpy('close'),
      recognizing: { on: jasmine.createSpy('on') },
      recognized: { on: jasmine.createSpy('on') },
      canceled: { on: jasmine.createSpy('on') },
      speechStartDetected: { on: jasmine.createSpy('on') },
      speechEndDetected: { on: jasmine.createSpy('on') }
    };

    // Create mock SpeechSDK
    mockSpeechSdk = {
      SpeechConfig: {
        fromSubscription: jasmine.createSpy('fromSubscription').and.returnValue({
          setProperty: jasmine.createSpy('setProperty')
        }),
        fromAuthorizationToken: jasmine.createSpy('fromAuthorizationToken').and.returnValue({
          setProperty: jasmine.createSpy('setProperty')
        })
      },
      AudioConfig: {
        fromDefaultMicrophoneInput: jasmine.createSpy('fromDefaultMicrophoneInput').and.returnValue({})
      },
      PropertyId: {
        Speech_SegmentationSilenceTimeoutMs: 'Speech_SegmentationSilenceTimeoutMs'
      },
      SpeechRecognizer: jasmine.createSpy('SpeechRecognizer').and.returnValue(mockRecognizer)
    };

    // Mock API service
    const mockApiService = {
      getSttToken: jasmine.createSpy('getSttToken').and.returnValue(Promise.resolve({
        token: 'test-token',
        region: 'test-region',
        error: null
      }))
    };

    TestBed.configureTestingModule({
      providers: [
        SpeechToTextService,
        { provide: MicrosoftSpeechSDK, useValue: mockSpeechSdk },
        { provide: SPEECH_SILENCE_TIMEOUT_MS, useValue: 5000 },
        { provide: ScribeApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(SpeechToTextService);
  });

  afterEach(() => {
    // Restore the original SpeechSDK property
    if (originalSpeechSDK) {
      (window as any).SpeechSDK = originalSpeechSDK;
    } else {
      delete (window as any).SpeechSDK;
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with NotStarted status', (done) => {
    service.streamingStatus$.subscribe(status => {
      expect(status).toBe(StreamingStatus.NotStarted);
      done();
    });
  });

  describe('loadSDK', () => {
    it('should set speechSDK when SpeechSDK is available on window', () => {
      // Mock the window.SpeechSDK
      (window as any).SpeechSDK = mockSpeechSdk;
      
      // Call loadSDK
      service.loadSDK();
      
      // Verify log message was shown
      expect(consoleLogSpy).toHaveBeenCalledWith('Speech SDK loaded');
    });
    
    it('should log error when SpeechSDK is not available on window', () => {
      // Ensure window.SpeechSDK is undefined
      delete (window as any).SpeechSDK;
      
      // Call loadSDK
      service.loadSDK();
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Speech SDK not loaded');
    });
  });

  describe('startSpeechRecognizer', () => {
    beforeEach(() => {
      // Mock the window.SpeechSDK
      (window as any).SpeechSDK = mockSpeechSdk;
      // Load the SDK
      service.loadSDK();
    });

    it('should create recognizer and start recognition', async () => {
      const startPromise = service.startSpeechRecognizer();
      
      // Wait for the start operation to complete
      await startPromise;
      
      // Verify SpeechSDK configuration
      expect(mockSpeechSdk.AudioConfig.fromDefaultMicrophoneInput).toHaveBeenCalled();
      expect(mockSpeechSdk.SpeechConfig.fromAuthorizationToken).toHaveBeenCalledWith('test-token', 'test-region');
      expect(mockSpeechSdk.SpeechRecognizer).toHaveBeenCalled();
      
      // Verify recognizer was started
      expect(mockRecognizer.startContinuousRecognitionAsync).toHaveBeenCalled();
    });

    it('should update status to Recording when started', async () => {
      // Create a promise that resolves when the status changes to Recording
      const statusPromise = firstValueFrom(
        service.streamingStatus$.pipe(
          skip(1), // Skip the initial NotStarted status
          take(1)  // Take the next status update
        )
      );

      // Start the recognizer
      await service.startSpeechRecognizer();

      // Wait for the status to change and verify it
      const status = await statusPromise;
      expect(status).toBe(StreamingStatus.Recording);
    });

    describe('error handling', () => {
      it('should handle start recognition error', async () => {
        // Mock the startContinuousRecognitionAsync to call error callback
        const testError = new Error('Failed to start recognition');
        mockRecognizer.startContinuousRecognitionAsync.and.callFake(
          (_: () => void, error: (err: any) => void) => error(testError)
        );

        // Create a promise that resolves when the status changes to Error
        const statusPromise = firstValueFrom(
          service.streamingStatus$.pipe(
            skip(1), // Skip the initial NotStarted status
            take(1)  // Take the next status update
          )
        );

        // Start the recognizer
        await service.startSpeechRecognizer();

        // Wait for and verify the error status
        const status = await statusPromise;
        expect(status).toBe(StreamingStatus.Error);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error starting classification recognition:',
          testError
        );
      });
    });

    describe('speech recognition events', () => {
      beforeEach(async () => {
        await service.startSpeechRecognizer();
      });

      it('should emit recognized text when valid text is received', async () => {
        // Create a promise that resolves when text is recognized
        const recognizedPromise = firstValueFrom(service.recognizedSpeech$);

        // Get the recognized callback that was set up
        const recognizedCallback = (service as any).speechRecognizer.recognized;

        // Simulate a recognition event with valid text
        const testText = 'Hello, world!';
        const mockEvent = {
          result: {
            text: testText
          }
        };
        recognizedCallback(null, mockEvent);

        // Wait for and verify the recognized text
        const result = await recognizedPromise;
        expect(result.text).toBe(testText);
        expect(result.timestamp).toBeDefined();
      });

      it('should not emit recognized text when empty text is received', (done) => {
        let emitted = false;
        
        // Subscribe to recognized text
        service.recognizedSpeech$.subscribe(() => {
          emitted = true;
        });

        // Get the recognized callback that was set up
        const recognizedCallback = (service as any).speechRecognizer.recognized;

        // Simulate a recognition event with empty text
        const mockEvent = {
          result: {
            text: '   '
          }
        };
        recognizedCallback(null, mockEvent);

        // Wait a bit to ensure no emission occurred
        setTimeout(() => {
          expect(emitted).toBeFalse();
          done();
        }, 100);
      });

      it('should not emit recognized text when null text is received', (done) => {
        let emitted = false;
        
        // Subscribe to recognized text
        service.recognizedSpeech$.subscribe(() => {
          emitted = true;
        });

        // Get the recognized callback that was set up
        const recognizedCallback = (service as any).speechRecognizer.recognized;

        // Simulate a recognition event with null text
        const mockEvent = {
          result: {
            text: null
          }
        };
        recognizedCallback(null, mockEvent);

        // Wait a bit to ensure no emission occurred
        setTimeout(() => {
          expect(emitted).toBeFalse();
          done();
        }, 100);
      });
    });
  });

  describe('stopSpeechRecognizer', () => {
    beforeEach(async () => {
      // Mock the window.SpeechSDK
      (window as any).SpeechSDK = mockSpeechSdk;
      // Load the SDK
      service.loadSDK();
      
      // Start the recognizer before each test
      await service.startSpeechRecognizer();
      // Ensure the speechRecognizer is set
      (service as any).speechRecognizer = mockRecognizer;
    });

    it('should stop recognition and clean up', async () => {
      await service.stopSpeechRecognizer();
      
      expect(mockRecognizer.stopContinuousRecognitionAsync).toHaveBeenCalled();
      expect(mockRecognizer.close).toHaveBeenCalled();
    });

    it('should update status to Stopped when stopped', async () => {
      // Create a promise that resolves when the status changes to Stopped
      const statusPromise = firstValueFrom(
        service.streamingStatus$.pipe(
          skip(1), // Skip the current status
          take(1)  // Take the next status update
        )
      );

      // Stop the recognizer
      await service.stopSpeechRecognizer();

      // Wait for the status to change and verify it
      const status = await statusPromise;
      expect(status).toBe(StreamingStatus.Stopped);
    });

    describe('error handling', () => {
      it('should handle stop recognition error', async () => {
        // Mock the stopContinuousRecognitionAsync to call error callback
        const testError = new Error('Failed to stop recognition');
        mockRecognizer.stopContinuousRecognitionAsync.and.callFake(
          (_: () => void, error: (err: any) => void) => error(testError)
        );

        // Create a promise that resolves when the status changes to Error
        const statusPromise = firstValueFrom(
          service.streamingStatus$.pipe(
            skip(1), // Skip the current status
            take(1)  // Take the next status update
          )
        );

        // Stop the recognizer
        await service.stopSpeechRecognizer();

        // Wait for and verify the error status
        const status = await statusPromise;
        expect(status).toBe(StreamingStatus.Error);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error stopping classification recognition:',
          testError
        );
        expect(mockRecognizer.close).toHaveBeenCalled();
      });

      it('should handle thrown errors during stop', async () => {
        // Mock the stopContinuousRecognitionAsync to throw an error
        const testError = new Error('Failed to stop recognition');
        mockRecognizer.stopContinuousRecognitionAsync.and.throwError(testError);

        // Create a promise that resolves when the status changes to Error
        const statusPromise = firstValueFrom(
          service.streamingStatus$.pipe(
            skip(1), // Skip the current status
            take(1)  // Take the next status update
          )
        );

        // Stop the recognizer
        await service.stopSpeechRecognizer();

        // Wait for and verify the error status
        const status = await statusPromise;
        expect(status).toBe(StreamingStatus.Error);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error stopping classification streaming recognition:',
          testError
        );
        expect(mockRecognizer.close).toHaveBeenCalled();
      });
    });
  });
}); 