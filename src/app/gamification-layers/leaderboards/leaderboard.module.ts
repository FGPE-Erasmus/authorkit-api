import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../../config';
import { GithubApiModule } from '../../github-api/github-api.module';
import { GamificationLayerModule } from '../gamification-layer.module';
import { ChallengeModule } from '../challenges/challenge.module';

import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardSyncProcessor } from './leaderboard-sync.processor';
import { LeaderboardEntity } from './entity/leaderboard.entity';
import { LEADERBOARD_SYNC_QUEUE } from './leaderboard.constants';

const PROVIDERS = [
    LeaderboardService,
    LeaderboardSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([LeaderboardEntity]),
    BullModule.registerQueue({
        name: LEADERBOARD_SYNC_QUEUE,
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
    controllers: [LeaderboardController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [LeaderboardService]
})
export class LeaderboardModule {}
