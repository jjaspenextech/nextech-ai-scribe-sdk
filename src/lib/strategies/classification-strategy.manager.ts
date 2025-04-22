import { InjectionToken } from '@angular/core';
import { Subject } from 'rxjs';
import { ImmediateClassificationStrategy } from './immediate-classification.strategy';
import { SequentialClassificationStrategy } from './sequential-classification.strategy';
import { ClassificationStrategy } from './classification-strategy.interface';

export type StrategyType = 'immediate' | 'sequential';

export type ClassificationStrategyManagerFactory = (
  classifyChunk: (chunk: string, chunks: string[]) => Promise<void>
) => ClassificationStrategyManager;

export const CLASSIFICATION_STRATEGY_MANAGER_FACTORY = new InjectionToken<ClassificationStrategyManagerFactory>(
  'CLASSIFICATION_STRATEGY_MANAGER_FACTORY',
  {
    providedIn: 'root',
    factory: () => createClassificationStrategyManager
  }
);

export const createClassificationStrategyManager = (
  classifyChunk: (chunk: string, chunks: string[]) => Promise<void>
) => {
  return new ClassificationStrategyManager(classifyChunk);
};

export class ClassificationStrategyManager {
  private currentStrategy: ClassificationStrategy | null = null;
  public classificationResults$ = new Subject<Record<string, any>>();

  constructor(
    private classifyChunk: (chunk: string, chunks: string[]) => Promise<void>
  ) {
    this.currentStrategy = new SequentialClassificationStrategy(classifyChunk);
  }

  setStrategy(type: StrategyType) {
    if (this.currentStrategy) {
      this.currentStrategy.cleanup();
    }
    switch (type) {
      case 'immediate':
        this.currentStrategy = new ImmediateClassificationStrategy(this.classifyChunk);
        break;
      case 'sequential':
        this.currentStrategy = new SequentialClassificationStrategy(this.classifyChunk);
        break;
      default:
        throw new Error(`Invalid strategy type: ${type}`);
    }
  }

  handleChunk(chunk: string) {
    if(this.currentStrategy) {
      this.currentStrategy.handleChunk(chunk);
    }
  }

  cleanup() {
    if (this.currentStrategy) {
      this.currentStrategy.cleanup();
    }
    this.classificationResults$.complete();
    this.currentStrategy = null;
  }
} 