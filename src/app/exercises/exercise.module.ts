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
import { GithubApiModule } from '../github-api/github-api.module';
import { TestController } from './tests/test.controller';
import { TestService } from './tests/test.service';
import { TestSetService } from './testsets/testset.service';
import { TestSetController } from './testsets/testset.controller';

const PROVIDERS = [
    ExerciseCommand,
    ExercisePipe,
    ExerciseContextMiddleware,
    ExerciseService,
    TestSetService,
    TestService
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
    forwardRef(() => ProjectModule),
    GithubApiModule
];

@Module({
    controllers: [ExerciseController, TestSetController, TestController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ExerciseService, TestSetService, TestService]
})
export class ExerciseModule {}
