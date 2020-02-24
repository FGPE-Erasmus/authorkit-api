import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { FeedbackGeneratorEntity } from './entity/feedback-generator.entity';
import { FeedbackGeneratorController } from './feedback-generator.controller';
import { FeedbackGeneratorSyncProcessor } from './feedback-generator-sync.processor';
import { FeedbackGeneratorService } from './feedback-generator.service';
import { FEEDBACK_GENERATOR_SYNC_QUEUE } from './feedback-generator.constants';

const PROVIDERS = [
    FeedbackGeneratorService,
    FeedbackGeneratorSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        FeedbackGeneratorEntity
    ]),
    BullModule.registerQueue({
        name: FEEDBACK_GENERATOR_SYNC_QUEUE,
        redis: {
          host: config.queueing.host,
          port: config.queueing.port
        },
        defaultJobOptions: {
            attempts: 10,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            lifo: true,
            removeOnComplete: true
        }
    }),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    forwardRef(() => ExerciseModule)
];

@Module({
    controllers: [FeedbackGeneratorController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [FeedbackGeneratorService]
})
export class FeedbackGeneratorModule {}
