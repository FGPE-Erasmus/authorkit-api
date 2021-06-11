import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { DynamicCorrectorModule } from '../dynamic-correctors/dynamic-corrector.module';
import { EmbeddableModule } from '../embeddables/embeddable.module';
import { FeedbackGeneratorModule } from '../feedback-generators/feedback-generator.module';
import { InstructionModule } from '../instructions/instruction.module';
import { LibraryModule } from '../libraries/library.module';
import { SkeletonModule } from '../skeletons/skeleton.module';
import { SolutionModule } from '../solutions/solution.module';
import { StatementModule } from '../statements/statement.module';
import { StaticCorrectorModule } from '../static-correctors/static-corrector.module';
import { TemplateModule } from '../templates/template.module';
import { TestGeneratorModule } from '../test-generators/test-generator.module';
import { TestSetModule } from '../testsets/testset.module';
import { TestModule } from '../tests/test.module';

import { ExercisePipe } from './pipe/exercise.pipe';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { ExerciseSyncProcessor } from './exercise-sync.processor';
import { ExerciseEntity } from './entity/exercise.entity';
import { EXERCISE_SYNC_QUEUE } from './exercise.constants';


const PROVIDERS = [
    ExercisePipe,
    ExerciseService,
    ExerciseSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        ExerciseEntity
    ]),
    BullModule.registerQueue({
        name: EXERCISE_SYNC_QUEUE,
        redis: {
          host: config.queueing.host,
          port: config.queueing.port
        },
        defaultJobOptions: {
            attempts: 20,
            backoff: {
                type: 'exponential',
                delay: 750
            },
            removeOnComplete: true
        }
    }),
    HttpModule,
    forwardRef(() => UserModule),
    forwardRef(() => ProjectModule),
    GithubApiModule,

    DynamicCorrectorModule,
    EmbeddableModule,
    FeedbackGeneratorModule,
    InstructionModule,
    LibraryModule,
    SkeletonModule,
    SolutionModule,
    StatementModule,
    StaticCorrectorModule,
    TemplateModule,
    TestGeneratorModule,
    TestSetModule,
    TestModule
];

@Module({
    controllers: [ExerciseController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ExerciseService]
})
export class ExerciseModule {}
