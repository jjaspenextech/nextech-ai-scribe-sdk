import { InjectionToken } from '@angular/core';
import { ScribeSchemaDefinition } from '../models/schema-definition';
import { ClassificationData } from '../models/classification';
import { ScribeAPIClient } from '../services/scribe-api/scribe-api.service';
/**
 * Configuration interface for the Scribe Engine
 */
export interface ScribeEngineConfig {
  schemaDefinition: ScribeSchemaDefinition;
  initialState?: ClassificationData; // Optional initial state
  initialChunks?: string[]; // Optional initial chunks
  azureSpeechKey: string;
  azureSpeechRegion: string;
  speechSilenceTimeoutMs: number;
}

// Default values for optional configurations
export const DEFAULT_INITIAL_STATE: ClassificationData = {
  sections: {},
  dataReferenceItems: {}
};
export const DEFAULT_INITIAL_CHUNKS: string[] = [];

/**
 * Injection tokens for the Scribe Engine configuration
 */
export const SCRIBE_SCHEMA_DEF = new InjectionToken<ScribeSchemaDefinition>('SCRIBE_SCHEMA_DEF');
export const SCRIBE_INITIAL_STATE = new InjectionToken<ClassificationData>('SCRIBE_INITIAL_STATE', {
  factory: () => DEFAULT_INITIAL_STATE
}); 
export const SCRIBE_INITIAL_CHUNKS = new InjectionToken<string[]>('SCRIBE_INITIAL_CHUNKS', {
  factory: () => DEFAULT_INITIAL_CHUNKS
});
export const SPEECH_SILENCE_TIMEOUT_MS = new InjectionToken<number>('SPEECH_SILENCE_TIMEOUT_MS');
export const SCRIBE_API_CLIENT = new InjectionToken<ScribeAPIClient>('SCRIBE_API_CLIENT');
