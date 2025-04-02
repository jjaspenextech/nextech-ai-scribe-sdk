import { BaseClassificationStrategy } from './base-classification.strategy';

export class SequentialClassificationStrategy extends BaseClassificationStrategy {
  private isProcessing = false;
  private chunkQueue: string[] = [];

  constructor(processChunk: (chunk: string, chunks: string[]) => Promise<void>) {
    super(processChunk);
  }

  async handleChunk(chunk: string) {
    this.chunkQueue.push(chunk);
    await this.processNextChunkIfReady();
  }

  private async processNextChunkIfReady() {
    if (this.isProcessing || this.chunkQueue.length === 0) return;
    
    this.isProcessing = true;
    const chunk = this.chunkQueue.shift()!;
    this.chunks.push(chunk);
    
    try {
      await this.processChunk(chunk, this.chunks);
    } finally {
      this.isProcessing = false;
      await this.processNextChunkIfReady();
    }
  }

  override cleanup(): void {
    this.chunkQueue = [];
    this.isProcessing = false;
    super.cleanup();
  }
} 