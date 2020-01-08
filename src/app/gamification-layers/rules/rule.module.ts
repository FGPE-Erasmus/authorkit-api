import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GithubApiModule } from '../../github-api/github-api.module';
import { GamificationLayerModule } from '../gamification-layer.module';
import { ChallengeModule } from '../challenges/challenge.module';

import { RuleService } from './rule.service';
import { RuleController } from './rule.controller';
import { RuleEntity } from './entity/rule.entity';
import { RuleEmitter } from './rule.emitter';
import { RuleListener } from './rule.listener';

const PROVIDERS = [
    RuleService,
    RuleEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([RuleEntity]),
    HttpModule,
    GamificationLayerModule,
    ChallengeModule,
    GithubApiModule
];

@Module({
    controllers: [RuleController, RuleListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [RuleService]
})
export class RuleModule {}
