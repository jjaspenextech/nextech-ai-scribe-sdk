import { InjectionToken } from '@angular/core';
import { ScribeSchemaDefinition } from '../models/schema-definition';
import { ClassificationData } from '../models/models';
/**
 * Configuration interface for the Scribe Engine
 */
export interface ScribeEngineConfig {
  apiUrl: string;
  apiKey: string;
  schemaDefinition: ScribeSchemaDefinition;
  initialState: ClassificationData; // Generic state, will be typed in the final library
  azureSpeechKey: string;
  azureSpeechRegion: string;
  speechSilenceTimeoutMs: number;
}

/**
 * Injection tokens for the Scribe Engine configuration
 */
export const SCRIBE_API_URL = new InjectionToken<string>('SCRIBE_API_URL');
export const SCRIBE_API_KEY = new InjectionToken<string>('SCRIBE_API_KEY');
export const SCRIBE_SCHEMA_DEF = new InjectionToken<ScribeSchemaDefinition>('SCRIBE_SCHEMA_DEF');
export const SCRIBE_INITIAL_STATE = new InjectionToken<ClassificationData>('SCRIBE_INITIAL_STATE'); 
export const SCRIBE_INITIAL_CHUNKS = new InjectionToken<string[]>('SCRIBE_INITIAL_CHUNKS');
export const AZURE_SPEECH_KEY = new InjectionToken<string>('AZURE_SPEECH_KEY');
export const AZURE_SPEECH_REGION = new InjectionToken<string>('AZURE_SPEECH_REGION');
export const SPEECH_SILENCE_TIMEOUT_MS = new InjectionToken<number>('SPEECH_SILENCE_TIMEOUT_MS');
