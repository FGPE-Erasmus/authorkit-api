import { Controller, Post } from '@nestjs/common';
import { OpenAIService } from './openAI.service';

@Controller('generate')
export class OpenAIController {
  constructor(private readonly generateService: OpenAIService) {}

  @Post()
  async generate(): Promise<string> {
    try {
      const result: string = await this.generateService.generate();
      return result;
    } catch (error) {
      console.error('Errore durante la generazione:', error);
      throw new Error('Errore durante la generazione.');
    }
  }
}
