import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../../config';
import { GithubApiModule } from '../../github-api/github-api.module';
import { GamificationLayerModule } from '../gamification-layer.module';
import { ChallengeModule } from '../challenges/challenge.module';

import { RULE_SYNC_QUEUE } from './rule.constants';
import { RuleService } from './rule.service';
import { RuleController } from './rule.controller';
import { RuleEntity } from './entity/rule.entity';
import { RuleSyncProcessor } from './rule-sync.processor';

const PROVIDERS = [
    RuleService,
    RuleSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([RuleEntity]),
    BullModule.registerQueue({
        name: RULE_SYNC_QUEUE,
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
    GithubApiModule,

    forwardRef(() => GamificationLayerModule),
    forwardRef(() => ChallengeModule)
];

@Module({
    controllers: [RuleController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [RuleService, RuleSyncProcessor]
})
export class RuleModule {}
