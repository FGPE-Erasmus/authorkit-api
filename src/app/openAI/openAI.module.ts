import { Module } from '@nestjs/common';
import { OpenAIController } from './openAI.controller';
import { OpenAIService } from './openAI.service';

@Module({
  controllers: [OpenAIController],
  providers: [OpenAIService]
})
export class OpenAIModule {}
