import { HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { SCRIBE_SCHEMA_DEF, SCRIBE_API_CLIENT } from '../../config/scribe-engine.config';

export interface ScribeAPIClient {
  get<T>(url: string, options?: { headers?: HttpHeaders }): Observable<T>;
  post<T>(url: string, body: any, options?: { headers?: HttpHeaders }): Observable<T>;
}

// Define API response and request interfaces
export interface ClassificationResult {
  classification: Record<string, any>;
  sections_present: Record<string, boolean>;
}

interface ConversationRequest {
  conversation_id?: string;
  output_schema?: Record<string, any>[];
  sequence_number?: number;
  prompt_text?: string;
}

interface ClassificationRequest extends ConversationRequest {
  sections?: string[];
}

interface SectionsPresentRequest extends ConversationRequest {
  sections: Record<string, any>[]
}

@Injectable({
  providedIn: 'root'
})
export class ScribeApiService {
  // Use inject to get configuration values
  private schemaList = inject(SCRIBE_SCHEMA_DEF);
  private httpClient = inject<ScribeAPIClient>(SCRIBE_API_CLIENT);
  
  private getHeaders(doctorGuid: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Provider-Guid': doctorGuid
    });
  }

  async initializeConversation(doctorGuid: string): Promise<string> {
    const url = `/classification/initialize`;
    const options = {
      headers: this.getHeaders(doctorGuid)
    };
    return firstValueFrom(this.httpClient.get<{ conversationGuid: string }>(url, options))
      .then(response => response.conversationGuid);
  }

  async getSectionsPresent( 
    transcription: string,
    doctorGuid: string,
    conversationGuid: string,
    sequenceNumber: number
  ): Promise<{ updatedFlags: Record<string, boolean> }> {
    const url = `/section/get_sections_present`;
    const options = {
      headers: this.getHeaders(doctorGuid),
      responseType: 'json' as const
    };
    const body: SectionsPresentRequest = {
      conversation_id: conversationGuid,
      output_schema: this.schemaList, // Use the calculated schema list
      sequence_number: sequenceNumber,
      prompt_text: transcription,
      sections: this.schemaList
    };
    return firstValueFrom(this.httpClient.post<{ updatedFlags: Record<string, boolean> }>(url, body, options));
  }

  async classifyConversation(
    transcription: string, 
    sections: string[], 
    doctorGuid: string,
    conversationGuid: string, 
    sequenceNumber: number
  ): Promise<ClassificationResult> {
    const url = `/classification/classify`;
    const options = {
      headers: this.getHeaders(doctorGuid),
      responseType: 'json' as const
    };
    const body: ClassificationRequest = {
      conversation_id: conversationGuid,
      output_schema: this.schemaList, // Use the calculated schema list
      sequence_number: sequenceNumber,
      prompt_text: transcription,
      sections: sections
    };
    return firstValueFrom(this.httpClient.post<ClassificationResult>(url, body, options));
  }

  async cleanupConversation(conversationGuid: string, doctorGuid: string): Promise<void> {
    const url = `/conversation/cleanup`;
    const options = {
      headers: this.getHeaders(doctorGuid)
    };
    return firstValueFrom(this.httpClient.post<void>(url, { conversationGuid }, options));
  }
}
