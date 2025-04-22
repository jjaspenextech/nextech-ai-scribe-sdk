import { ImmediateClassificationStrategy } from './immediate-classification.strategy';

describe('ImmediateClassificationStrategy', () => {
  let strategy: ImmediateClassificationStrategy;
  let processChunkSpy: jasmine.Spy;
  
  beforeEach(() => {
    // Create a spy for the processChunk function
    processChunkSpy = jasmine.createSpy('processChunk').and.returnValue(Promise.resolve());
    
    // Create strategy with the spy
    strategy = new ImmediateClassificationStrategy(processChunkSpy);
  });
  
  it('should be created', () => {
    expect(strategy).toBeTruthy();
  });
  
  describe('handleChunk', () => {
    it('should immediately process each chunk', async () => {
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
    
    it('should store chunks for future context', async () => {
      // Handle several chunks
      await strategy.handleChunk('chunk1');
      await strategy.handleChunk('chunk2');
      await strategy.handleChunk('chunk3');
      
      // Verify all chunks are stored
      expect((strategy as any).chunks).toEqual(['chunk1', 'chunk2', 'chunk3']);
      
      // Verify last call has all chunks
      expect(processChunkSpy.calls.argsFor(2)).toEqual(['chunk3', ['chunk1', 'chunk2', 'chunk3']]);
    });
  });
}); 