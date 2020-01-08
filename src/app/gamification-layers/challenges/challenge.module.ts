import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GamificationLayerModule } from '../gamification-layer.module';
import { GithubApiModule } from '../../github-api/github-api.module';

import { ChallengeService } from './challenge.service';
import { ChallengeController } from './challenge.controller';
import { ChallengeEntity } from './entity/challenge.entity';
import { ChallengeEmitter } from './challenge.emitter';
import { ChallengeListener } from './challenge.listener';

const PROVIDERS = [
    ChallengeService,
    ChallengeEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([ChallengeEntity]),
    HttpModule,
    GamificationLayerModule,
    GithubApiModule
];

@Module({
    controllers: [ChallengeController, ChallengeListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ChallengeService]
})
export class ChallengeModule {}
