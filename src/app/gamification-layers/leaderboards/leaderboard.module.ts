import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GithubApiModule } from '../../github-api/github-api.module';
import { GamificationLayerModule } from '../gamification-layer.module';
import { ChallengeModule } from '../challenges/challenge.module';

import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardEntity } from './entity/leaderboard.entity';
import { LeaderboardEmitter } from './leaderboard.emitter';
import { LeaderboardListener } from './leaderboard.listener';

const PROVIDERS = [
    LeaderboardService,
    LeaderboardEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([LeaderboardEntity]),
    HttpModule,
    GamificationLayerModule,
    ChallengeModule,
    GithubApiModule
];

@Module({
    controllers: [LeaderboardController, LeaderboardListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [LeaderboardService]
})
export class LeaderboardModule {}
