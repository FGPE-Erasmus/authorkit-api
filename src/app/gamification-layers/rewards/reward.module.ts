import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../../config';
import { GithubApiModule } from '../../github-api/github-api.module';
import { GamificationLayerModule } from '../gamification-layer.module';
import { ChallengeModule } from '../challenges/challenge.module';

import { REWARD_SYNC_QUEUE } from './reward.constants';
import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';
import { RewardEntity } from './entity/reward.entity';
import { RewardSyncProcessor } from './reward-sync.processor';


const PROVIDERS = [
    RewardService,
    RewardSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([RewardEntity]),
    BullModule.registerQueue({
        name: REWARD_SYNC_QUEUE,
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
    ChallengeModule,
    GithubApiModule
];

@Module({
    controllers: [RewardController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [RewardService, RewardSyncProcessor]
})
export class RewardModule {}
