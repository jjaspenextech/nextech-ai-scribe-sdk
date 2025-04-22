import { firstValueFrom, Subject, take } from 'rxjs';
import { ClassificationStrategyManager, StrategyType } from './classification-strategy.manager';
import { ImmediateClassificationStrategy } from './immediate-classification.strategy';
import { SequentialClassificationStrategy } from './sequential-classification.strategy';

describe('ClassificationStrategyManager', () => {
  let manager: ClassificationStrategyManager;
  let processChunkSpy: jasmine.Spy;
  let chunks: string[] = [];
  let mockResult: Record<string, any>;

  beforeEach(() => {
    chunks = [];
    mockResult = { testResult: 'value' };
    
    // Create spy for the processChunk function
    processChunkSpy = jasmine.createSpy('processChunk').and.callFake(async (chunk: string) => {
      chunks.push(chunk);
    });
    
    manager = new ClassificationStrategyManager(processChunkSpy);
  });

  afterEach(() => {
    manager.cleanup();
  });

  it('should create an instance', () => {
    expect(manager).toBeTruthy();
  });

  describe('setStrategy', () => {
    it('should set immediate strategy', () => {
      manager.setStrategy('immediate');
      const currentStrategy = (manager as any).currentStrategy;
      
      expect(currentStrategy).toBeTruthy();
      expect(currentStrategy instanceof ImmediateClassificationStrategy).toBe(true);
    });

    it('should set sequential strategy', () => {
      manager.setStrategy('sequential');
      const currentStrategy = (manager as any).currentStrategy;
      
      expect(currentStrategy).toBeTruthy();
      expect(currentStrategy instanceof SequentialClassificationStrategy).toBe(true);
    });

    it('should throw error for invalid strategy type', () => {
      expect(() => manager.setStrategy('invalid' as StrategyType)).toThrowError('Invalid strategy type: invalid');
    });

    it('should clean up previous strategy when setting new one', () => {
      // Set initial strategy
      manager.setStrategy('immediate');
      const initialStrategy = (manager as any).currentStrategy;
      
      // Spy on cleanup method
      spyOn(initialStrategy, 'cleanup');
      
      // Set new strategy
      manager.setStrategy('sequential');
      
      // Verify cleanup was called
      expect(initialStrategy.cleanup).toHaveBeenCalled();
    });
  });

  describe('handleChunk', () => {
    it('should delegate chunk handling to current strategy', () => {
      manager.setStrategy('immediate');
      const strategy = (manager as any).currentStrategy;
      
      spyOn(strategy, 'handleChunk');
      
      manager.handleChunk('test chunk');
      
      expect(strategy.handleChunk).toHaveBeenCalledWith('test chunk');
    });

    it('should handle null or empty chunks gracefully', () => {
      manager.setStrategy('immediate');
      const strategy = (manager as any).currentStrategy;
      
      spyOn(strategy, 'handleChunk');
      
      manager.handleChunk('');
      manager.handleChunk(null as any);
      
      expect(strategy.handleChunk).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanup', () => {
    it('should clean up current strategy', () => {
      manager.setStrategy('immediate');
      const strategy = (manager as any).currentStrategy;
      
      spyOn(strategy, 'cleanup');
      
      manager.cleanup();
      
      expect(strategy.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup when no strategy is set', () => {
      (manager as any).currentStrategy = null;
      
      // Should not throw error
      expect(() => manager.cleanup()).not.toThrow();
    });

    it('should set current strategy to null', () => {
      manager.setStrategy('immediate');
      
      manager.cleanup();
      
      expect((manager as any).currentStrategy).toBeNull();
    });

    it('should complete the classificationResults$ subject', () => {
      let completed = false;
      manager.classificationResults$.subscribe({
        complete: () => { completed = true; }
      });
      
      manager.cleanup();
      
      expect(completed).toBe(true);
    });

    it('should handle multiple cleanup calls gracefully', () => {
      manager.cleanup();
      
      // Second cleanup should not throw
      expect(() => manager.cleanup()).not.toThrow();
    });
  });
}); 