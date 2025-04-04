import { HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { SCRIBE_SCHEMA_DEF, SCRIBE_API_CLIENT } from '../../config/scribe-engine.config';
import { ClassificationResult, 
  SectionsPresentRequest, 
  ClassificationRequest,
  SttTokenResponse
} from '../../models/api';

export interface ScribeAPIClient {
  get<T>(url: string, options?: { headers?: HttpHeaders }): Observable<T>;
  post<T>(url: string, body: any, options?: { headers?: HttpHeaders }): Observable<T>;
}

@Injectable({
  providedIn: 'root'
})
export class ScribeApiService {
  // Use inject to get configuration values
  private schemaList = inject(SCRIBE_SCHEMA_DEF);
  private httpClient = inject<ScribeAPIClient>(SCRIBE_API_CLIENT);
  
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  async initializeConversation(): Promise<string> {
    const url = `/classification/initialize`;
    const options = {
      headers: this.getHeaders()
    };
    return firstValueFrom(this.httpClient.get<{ conversationGuid: string }>(url, options))
      .then(response => response.conversationGuid);
  }

  async getSectionsPresent( 
    transcription: string,
    conversationGuid: string,
    sequenceNumber: number
  ): Promise<{ updatedFlags: Record<string, boolean> }> {
    const url = `/section/get_sections_present`;
    const options = {
      headers: this.getHeaders(),
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
    conversationGuid: string, 
    sequenceNumber: number
  ): Promise<ClassificationResult> {
    const url = `/classification/classify`;
    const options = {
      headers: this.getHeaders(),
      responseType: 'json' as const
    };
    const body: ClassificationRequest = {
      conversation_id: conversationGuid,
      output_schema: this.schemaList,
      sequence_number: sequenceNumber,
      prompt_text: transcription,
      sections: sections
    };
    return firstValueFrom(this.httpClient.post<ClassificationResult>(url, body, options));
  }

  async cleanupConversation(conversationGuid: string): Promise<void> {
    const url = `/conversation/cleanup`;
    const options = {
      headers: this.getHeaders()
    };
    return firstValueFrom(this.httpClient.post<void>(url, { conversationGuid }, options));
  }

  async getSttToken(): Promise<SttTokenResponse> {
    const url = `/stt/token`;
    const options = {
      headers: this.getHeaders()
    };
    return firstValueFrom(
      this.httpClient.get<SttTokenResponse>(url, options)
    ).then(response => {
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    });
  }
}
