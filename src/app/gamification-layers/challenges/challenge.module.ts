import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../../config';
import { GithubApiModule } from '../../github-api/github-api.module';
import { GamificationLayerModule } from '../gamification-layer.module';

import { CHALLENGE_SYNC_QUEUE } from './challenge.constants';
import { ChallengeService } from './challenge.service';
import { ChallengeController } from './challenge.controller';
import { ChallengeEntity } from './entity/challenge.entity';
import { ChallengeSyncProcessor } from './challenge-sync.processor';

const PROVIDERS = [
    ChallengeService,
    ChallengeSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([ChallengeEntity]),
    BullModule.registerQueue({
        name: CHALLENGE_SYNC_QUEUE,
        redis: {
          host: config.queueing.host,
          port: config.queueing.port
        },
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            lifo: true,
            removeOnComplete: true
        }
    }),
    HttpModule,
    GamificationLayerModule,
    GithubApiModule
];

@Module({
    controllers: [ChallengeController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ChallengeService]
})
export class ChallengeModule {}
