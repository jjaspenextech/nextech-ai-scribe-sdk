export interface ClassificationResult {
  classification: Record<string, any>;
  sections_present: Record<string, boolean>;
}

export interface SttTokenResponse {
  token: string;
  region: string;
  error?: string;
}

export interface ConversationRequest {
  conversation_id?: string;
  output_schema?: Record<string, any>[];
  sequence_number?: number;
  prompt_text?: string;
}

export interface ClassificationRequest extends ConversationRequest {
  sections?: string[];
}

export interface SectionsPresentRequest extends ConversationRequest {
  sections: Record<string, any>[]
}


