import { BaseClassificationStrategy } from './base-classification.strategy';

export class ImmediateClassificationStrategy extends BaseClassificationStrategy {
  async handleChunk(chunk: string) {
    this.chunks.push(chunk);
    await this.processChunk(chunk, this.chunks);
  }
} 