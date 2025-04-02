import { BaseClassificationStrategy } from './base-classification.strategy';

// Create a concrete implementation of the abstract class for testing
class TestClassificationStrategy extends BaseClassificationStrategy {
  handleChunk(chunk: string): void {
    this.chunks.push(chunk);
  }
}

describe('BaseClassificationStrategy', () => {
  let strategy: TestClassificationStrategy;
  let processChunkSpy: jasmine.Spy;
  
  beforeEach(() => {
    processChunkSpy = jasmine.createSpy('processChunk').and.returnValue(Promise.resolve());
    strategy = new TestClassificationStrategy(processChunkSpy);
  });
  
  it('should be created', () => {
    expect(strategy).toBeTruthy();
  });
  
  describe('cleanup', () => {
    it('should clear chunks array and complete the results subject', () => {
      // Add some test data
      strategy.handleChunk('test chunk');
      expect((strategy as any).chunks.length).toBe(1);
      
      // Set up completion detection
      let completed = false;
      strategy.results$.subscribe({
        complete: () => { completed = true; }
      });
      
      // Call cleanup
      strategy.cleanup();
      
      // Verify chunks are cleared and subject is completed
      expect((strategy as any).chunks).toEqual([]);
      expect(completed).toBe(true);
    });
  });
}); 