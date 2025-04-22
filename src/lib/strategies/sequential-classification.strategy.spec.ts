import { SequentialClassificationStrategy } from './sequential-classification.strategy';

describe('SequentialClassificationStrategy', () => {
  let strategy: SequentialClassificationStrategy;
  let processChunkSpy: jasmine.Spy;
  
  beforeEach(() => {
    // Create a spy for the processChunk function
    processChunkSpy = jasmine.createSpy('processChunk').and.returnValue(Promise.resolve());
    
    // Create strategy with the spy
    strategy = new SequentialClassificationStrategy(processChunkSpy);
  });
  
  it('should be created', () => {
    expect(strategy).toBeTruthy();
  });
  
  describe('handleChunk', () => {
    it('should process chunks sequentially', async () => {
      // Handle a new chunk
      await strategy.handleChunk('chunk1');
      
      // Verify the chunk was added to the chunks array
      expect((strategy as any).chunks).toContain('chunk1');
      
      // Verify processChunk was called with the correct parameters
      expect(processChunkSpy).toHaveBeenCalledWith('chunk1', ['chunk1']);
      
      // Handle another chunk
      await strategy.handleChunk('chunk2');
      
      // Verify the second chunk was added to the chunks array
      expect((strategy as any).chunks).toEqual(['chunk1', 'chunk2']);
      
      // Verify processChunk was called again with the correct parameters
      expect(processChunkSpy).toHaveBeenCalledWith('chunk2', ['chunk1', 'chunk2']);
      expect(processChunkSpy).toHaveBeenCalledTimes(2);
    });
    
    it('should queue chunks if one is still processing', async () => {
      // Create a promise we can control to simulate a long-running process
      let resolveFirst: Function;
      const processingPromise = new Promise<void>(resolve => {
        resolveFirst = resolve;
      });
      
      // Replace the processChunk spy with one that returns our controlled promise
      processChunkSpy.and.returnValue(processingPromise);
      
      // Handle the first chunk - this will start processing but not complete
      const firstPromise = strategy.handleChunk('chunk1');
      
      // The first chunk should be added to the chunks array immediately
      expect((strategy as any).chunks).toEqual(['chunk1']);
      
      // The process should be marked as processing
      expect((strategy as any).isProcessing).toBe(true);
      
      // Queue a second chunk while the first is still processing
      strategy.handleChunk('chunk2');
      
      // The second chunk should be added to the queue
      expect((strategy as any).chunkQueue).toContain('chunk2');
      
      // Only the first chunk should have been processed so far
      expect(processChunkSpy).toHaveBeenCalledTimes(1);
      expect(processChunkSpy).toHaveBeenCalledWith('chunk1', ['chunk1']);
      
      // Now complete the first chunk processing
      resolveFirst!();
      await firstPromise;
      
      // Give a short time for the queued processing to start
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // The second chunk should now be processed
      expect(processChunkSpy).toHaveBeenCalledTimes(2);
      expect(processChunkSpy).toHaveBeenCalledWith('chunk2', ['chunk1', 'chunk2']);
      
      // Both chunks should be in the chunks array
      expect((strategy as any).chunks).toEqual(['chunk1', 'chunk2']);
      
      // The queue should be empty again
      expect((strategy as any).chunkQueue.length).toBe(0);
    });
    
    it('should process multiple queued chunks in order', async () => {
      // Create a promise we can control to simulate a long-running process
      let resolveFirst: Function;
      const processingPromise = new Promise<void>(resolve => {
        resolveFirst = resolve;
      });
      
      // Replace the processChunk spy with one that returns our controlled promise for the first call only
      processChunkSpy.and.callFake((chunk: string, chunks: string[]) => {
        if (chunk === 'chunk1') {
          return processingPromise;
        }
        return Promise.resolve();
      });
      
      // Handle the first chunk - this will start processing but not complete
      const firstPromise = strategy.handleChunk('chunk1');
      
      // Queue multiple chunks while the first is still processing
      strategy.handleChunk('chunk2');
      strategy.handleChunk('chunk3');
      strategy.handleChunk('chunk4');
      
      // Only the first chunk should have been processed so far
      expect(processChunkSpy).toHaveBeenCalledTimes(1);
      
      // The queue should contain all the other chunks
      expect((strategy as any).chunkQueue).toEqual(['chunk2', 'chunk3', 'chunk4']);
      
      // Now complete the first chunk processing
      resolveFirst!();
      await firstPromise;
      
      // Give time for all queued items to process
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // All chunks should now be processed
      expect(processChunkSpy).toHaveBeenCalledTimes(4);
      
      // The chunks should be processed in order
      expect(processChunkSpy.calls.argsFor(0)[0]).toBe('chunk1');
      expect(processChunkSpy.calls.argsFor(1)[0]).toBe('chunk2');
      expect(processChunkSpy.calls.argsFor(2)[0]).toBe('chunk3');
      expect(processChunkSpy.calls.argsFor(3)[0]).toBe('chunk4');
      
      // All chunks should be in the chunks array in order
      expect((strategy as any).chunks).toEqual(['chunk1', 'chunk2', 'chunk3', 'chunk4']);
      
      // The queue should be empty
      expect((strategy as any).chunkQueue.length).toBe(0);
    });
  });
  
  describe('cleanup', () => {
    it('should clear queue and reset processing state in addition to base cleanup', () => {
      // Set some initial state
      (strategy as any).chunkQueue = ['chunk1', 'chunk2'];
      (strategy as any).isProcessing = true;
      (strategy as any).chunks = ['chunk0'];
      
      // Set up completion detection
      let completed = false;
      strategy.results$.subscribe({
        complete: () => { completed = true; }
      });
      
      // Call cleanup
      strategy.cleanup();
      
      // Verify everything is reset
      expect((strategy as any).chunkQueue).toEqual([]);
      expect((strategy as any).isProcessing).toBe(false);
      expect((strategy as any).chunks).toEqual([]);
      expect(completed).toBe(true);
    });
  });
}); 