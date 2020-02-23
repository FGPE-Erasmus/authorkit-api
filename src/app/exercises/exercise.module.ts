import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';
import { GithubApiModule } from '../github-api/github-api.module';

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
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            lifo: true,
            removeOnComplete: true
        }
    }),
    HttpModule,
    forwardRef(() => UserModule),
    forwardRef(() => ProjectModule),
    GithubApiModule
];

@Module({
    controllers: [ExerciseController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ExerciseService]
})
export class ExerciseModule {}
