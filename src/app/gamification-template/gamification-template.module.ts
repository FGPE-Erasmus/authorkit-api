import { Module } from '@nestjs/common';
import {GamificationTemplateController} from './gamification-template.controller';
import { GamificationLayerModule } from '../gamification-layers/gamification-layer.module';
import { GamificationTemplateService } from './gamification-template.service';
import { GithubApiModule } from '../github-api/github-api.module';


const PROVIDERS = [
    GamificationTemplateService
];

@Module({
    controllers: [GamificationTemplateController],
    providers: [...PROVIDERS],
    imports: [GamificationLayerModule, GithubApiModule]
})

export class GamificationTemplateModule {
}

