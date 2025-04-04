import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ScribeApiService } from './scribe-api.service';
import { ClassificationResult } from '../../models/api';

describe('ScribeApiService', () => {
  let service: ScribeApiService;
  let httpMock: HttpTestingController;
  const mockApiUrl = 'https://test-api.example.com';
  const mockDoctorGuid = 'test-doctor-guid';
  const mockConversationGuid = 'test-conversation-guid';

  beforeEach(() => {
    // Properly mock environment
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ScribeApiService]
    });

    // Override environment.apiUrl for testing
    // Object.defineProperty(environment, 'apiUrl', { get: () => mockApiUrl });

    service = TestBed.inject(ScribeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeConversation', () => {
    it('should make a GET request to initialize conversation and return conversationGuid', async () => {
      const expectedResponse = { conversationGuid: mockConversationGuid };
      
      const promise = service.initializeConversation();
      
      const req = httpMock.expectOne(`${mockApiUrl}/conversation/initialize`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-Provider-Guid')).toBe(mockDoctorGuid);
      req.flush(expectedResponse);
      
      const result = await promise;
      expect(result).toBe(mockConversationGuid);
    });
  });

  describe('getSectionsPresent', () => {
    it('should make a POST request with correct data and return updated flags', async () => {
      const sectionFlags = { 'section1': true, 'section2': false, 'section3': true };
      const transcription = 'Test transcription';
      const sequenceNumber = 1;
      const expectedResponse = { updatedFlags: { 'section1': true, 'section2': true, 'section3': true } };
      
      const promise = service.getSectionsPresent(
        transcription, 
          mockConversationGuid, 
        sequenceNumber
      );
      
      const req = httpMock.expectOne(`${mockApiUrl}/section/get_sections_present`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('X-Provider-Guid')).toBe(mockDoctorGuid);
      expect(req.request.body).toEqual({
        conversation_id: mockConversationGuid,
        output_schema: [],
        sequence_number: sequenceNumber,
        prompt_text: transcription,
        sections: []
      });
      req.flush(expectedResponse);
      
      const result = await promise;
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('classifyConversation', () => {
    it('should make a POST request with correct data and return classification result', async () => {
      const transcription = 'Test transcription';
      const sections = ['section1', 'section3'];
      const sequenceNumber = 2;
      const mockClassificationResult: ClassificationResult = {
        classification: {
          reasonForVisit: { someData: 'value' },
          plan: { someData: 'value' }
        },
        sections_present: {
          'section1': true,
          'section3': true
        }
      };
      
      const promise = service.classifyConversation(
        transcription, 
        sections, 
        mockConversationGuid, 
        sequenceNumber
      );
      
      const req = httpMock.expectOne(`${mockApiUrl}/conversation/classify`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('X-Provider-Guid')).toBe(mockDoctorGuid);
      expect(req.request.body).toEqual({
        conversation_id: mockConversationGuid,
        output_schema: [],
        sequence_number: sequenceNumber,
        prompt_text: transcription,
        sections: sections
      });
      req.flush(mockClassificationResult);
      
      const result = await promise;
      expect(result).toEqual(mockClassificationResult);
    });
  });

  describe('cleanupConversation', () => {
    it('should make a POST request to cleanup conversation', async () => {
      const promise = service.cleanupConversation(mockConversationGuid);
      
      const req = httpMock.expectOne(`${mockApiUrl}/conversation/cleanup`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('X-Provider-Guid')).toBe(mockDoctorGuid);
      expect(req.request.body).toEqual({ conversationGuid: mockConversationGuid });
      req.flush(null);
      
      await promise;
      // If no error is thrown, the test passes
      expect().nothing();
    });
  });

  describe('error handling', () => {
    it('should propagate errors from the API', async () => {
      const errorResponse = { status: 500, statusText: 'Server Error' };
      
      const promise = service.initializeConversation();
      
      const req = httpMock.expectOne(`${mockApiUrl}/conversation/initialize`);
      req.flush('Error', errorResponse);
      
      await expectAsync(promise).toBeRejected();
    });
  });
}); 