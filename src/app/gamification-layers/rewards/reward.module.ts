import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GithubApiModule } from '../../github-api/github-api.module';
import { GamificationLayerModule } from '../gamification-layer.module';
import { ChallengeModule } from '../challenges/challenge.module';

import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';
import { RewardEntity } from './entity/reward.entity';
import { RewardEmitter } from './reward.emitter';
import { RewardListener } from './reward.listener';

const PROVIDERS = [
    RewardService,
    RewardEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([RewardEntity]),
    HttpModule,
    GamificationLayerModule,
    ChallengeModule,
    GithubApiModule
];

@Module({
    controllers: [RewardController, RewardListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [RewardService]
})
export class RewardModule {}
