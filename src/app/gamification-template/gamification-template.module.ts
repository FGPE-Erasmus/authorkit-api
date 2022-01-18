import { Module } from '@nestjs/common';
import {GamificationTemplateController} from './gamification-template.controller';

@Module({
    controllers: [GamificationTemplateController]
})

export class GamificationTemplateModule {
}
