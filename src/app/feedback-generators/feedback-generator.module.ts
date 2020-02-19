import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { FeedbackGeneratorEntity } from './entity/feedback-generator.entity';
import { FeedbackGeneratorController } from './feedback-generator.controller';
import { FeedbackGeneratorListener } from './feedback-generator.listener';
import { FeedbackGeneratorService } from './feedback-generator.service';
import { FeedbackGeneratorEmitter } from './feedback-generator.emitter';

const PROVIDERS = [
    FeedbackGeneratorService,
    FeedbackGeneratorEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        FeedbackGeneratorEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [FeedbackGeneratorController, FeedbackGeneratorListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [FeedbackGeneratorService]
})
export class FeedbackGeneratorModule {}
