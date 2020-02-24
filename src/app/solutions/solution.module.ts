import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { SolutionEntity } from './entity/solution.entity';
import { SolutionController } from './solution.controller';
import { SolutionSyncProcessor } from './solution-sync.processor';
import { SolutionService } from './solution.service';
import { SOLUTION_SYNC_QUEUE } from './solution.constants';

const PROVIDERS = [
    SolutionService,
    SolutionSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        SolutionEntity
    ]),
    BullModule.registerQueue({
        name: SOLUTION_SYNC_QUEUE,
        redis: {
          host: config.queueing.host,
          port: config.queueing.port
        },
        defaultJobOptions: {
            attempts: 10,
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
    GithubApiModule,
    forwardRef(() => ExerciseModule)
];

@Module({
    controllers: [SolutionController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [SolutionService]
})
export class SolutionModule {}
