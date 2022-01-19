import { Module } from '@nestjs/common';
import {GamificationTemplateController} from './gamification-template.controller';
import { GamificationLayerModule } from '../gamification-layers/gamification-layer.module';

@Module({
    controllers: [GamificationTemplateController],
    imports: [GamificationLayerModule]
})

export class GamificationTemplateModule {
}
