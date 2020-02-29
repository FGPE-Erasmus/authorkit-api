import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { PermissionModule } from '../permissions/permission.module';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';
import { GithubApiModule } from '../github-api/github-api.module';

import { GamificationLayerService } from './gamification-layer.service';
import { GamificationLayerController } from './gamification-layer.controller';
import { GamificationLayerEntity } from './entity/gamification-layer.entity';
import { GamificationLayerSyncProcessor } from './gamification-layer-sync.processor';
import { GAMIFICATION_LAYER_SYNC_QUEUE } from './gamification-layer.constants';
import { LeaderboardModule } from './leaderboards/leaderboard.module';
import { ChallengeModule } from './challenges/challenge.module';
import { RewardModule } from './rewards/reward.module';
import { RuleModule } from './rules/rule.module';

const PROVIDERS = [
    GamificationLayerService,
    GamificationLayerSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([GamificationLayerEntity]),
    BullModule.registerQueue({
        name: GAMIFICATION_LAYER_SYNC_QUEUE,
        redis: {
          host: config.queueing.host,
          port: config.queueing.port
        },
        defaultJobOptions: {
            attempts: 20,
            backoff: {
                type: 'exponential',
                delay: 500
            },
            lifo: true,
            removeOnComplete: true
        }
    }),
    HttpModule,
    PermissionModule,
    forwardRef(() => UserModule),
    forwardRef(() => ProjectModule),
    GithubApiModule,

    forwardRef(() => ChallengeModule),
    forwardRef(() => LeaderboardModule),
    forwardRef(() => RewardModule),
    forwardRef(() => RuleModule)
];

@Module({
    controllers: [GamificationLayerController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [GamificationLayerService]
})
export class GamificationLayerModule {}
