import { Observable } from 'rxjs';

export interface ClassificationStrategy {
  // Stream of classification results
  results$: Observable<Record<string,any>>;
  
  // Handle new chunks of text
  handleChunk(chunk: string): void;
  
  // Cleanup resources
  cleanup(): void;
} 