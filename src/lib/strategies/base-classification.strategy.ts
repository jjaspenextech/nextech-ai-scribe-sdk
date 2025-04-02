import { Subject } from 'rxjs';
import { ClassificationStrategy } from './classification-strategy.interface';

export abstract class BaseClassificationStrategy implements ClassificationStrategy {
  public results$ = new Subject<Record<string,any>>();
  protected chunks: string[] = [];
  
  constructor(
    protected processChunk: (chunk: string, chunks: string[]) => Promise<void>
  ) {}

  // Abstract method that each strategy must implement
  abstract handleChunk(chunk: string): void;

  cleanup(): void {
    this.chunks = [];
    this.results$.complete();
  }
} 