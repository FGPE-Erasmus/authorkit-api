import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../../config';
import { GitModule } from '../../git/git.module';
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
            attempts: 20,
            backoff: {
                type: 'exponential',
                delay: 750
            },
            removeOnComplete: true
        }
    }),
    HttpModule,
    GitModule,

    forwardRef(() => GamificationLayerModule),
    forwardRef(() => ChallengeModule)
];

@Module({
    controllers: [LeaderboardController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [LeaderboardService]
})
export class LeaderboardModule {}
