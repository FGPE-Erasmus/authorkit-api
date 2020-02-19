import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessControlModule } from '../access-control/access-control.module';
import { accessRules } from '../app.access-rules';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';
import { GithubApiModule } from '../github-api/github-api.module';

import { ExerciseCommand } from './exercise.command';
import { ExercisePipe } from './pipe/exercise.pipe';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { ExerciseListener } from './exercise.listener';
import { ExerciseEmitter } from './exercise.emitter';
import { ExerciseContextMiddleware } from './exercise-context.middleware';
import {
    ExerciseEntity,
    ExerciseDynamicCorrectorEntity,
    ExerciseEmbeddableEntity,
    ExerciseFeedbackGeneratorEntity,
    ExerciseInstructionEntity,
    ExerciseLibraryEntity,
    ExerciseSkeletonEntity,
    ExerciseSolutionEntity,
    ExerciseStatementEntity,
    ExerciseStaticCorrectorEntity,
    ExerciseTemplateEntity,
    ExerciseTestGeneratorEntity
} from './entity';


const PROVIDERS = [
    ExerciseCommand,
    ExercisePipe,
    ExerciseContextMiddleware,
    ExerciseService,
    ExerciseEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        ExerciseEntity,
        ExerciseDynamicCorrectorEntity,
        ExerciseEmbeddableEntity,
        ExerciseFeedbackGeneratorEntity,
        ExerciseInstructionEntity,
        ExerciseLibraryEntity,
        ExerciseSkeletonEntity,
        ExerciseSolutionEntity,
        ExerciseStatementEntity,
        ExerciseStaticCorrectorEntity,
        ExerciseTemplateEntity,
        ExerciseTestGeneratorEntity
    ]),
    AccessControlModule.forRoles(accessRules),
    HttpModule,
    forwardRef(() => UserModule),
    forwardRef(() => ProjectModule),
    GithubApiModule
];

@Module({
    controllers: [ExerciseController, ExerciseListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ExerciseService]
})
export class ExerciseModule {}
