import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessControlModule } from '../access-control/access-control.module';
import { accessRules } from '../app.access-rules';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';

import { ExerciseCommand } from './exercise.command';
import { ExercisePipe } from './pipe/exercise.pipe';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
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
    ExerciseTestEntity,
    ExerciseTestGeneratorEntity,
    ExerciseTestSetEntity
} from './entity';

const PROVIDERS = [
    ExerciseCommand,
    ExercisePipe,
    ExerciseContextMiddleware,
    ExerciseService
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
        ExerciseTestEntity,
        ExerciseTestGeneratorEntity,
        ExerciseTestSetEntity
    ]),
    AccessControlModule.forRoles(accessRules),
    HttpModule,
    forwardRef(() => UserModule),
    forwardRef(() => ProjectModule)
];

@Module({
    controllers: [ExerciseController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ExerciseService]
})
export class ExerciseModule {}
