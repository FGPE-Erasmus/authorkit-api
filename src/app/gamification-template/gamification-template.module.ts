import { Module } from '@nestjs/common';
import {GamificationTemplateController} from './gamification-template.controller';
import { MODULES } from '../gamification-layers/gamification-layer.module';

@Module({
    controllers: [GamificationTemplateController],
    imports: [...MODULES]
})

export class GamificationTemplateModule {
}
