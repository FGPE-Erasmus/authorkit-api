import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { SkeletonEntity } from './entity/skeleton.entity';
import { SkeletonController } from './skeleton.controller';
import { SkeletonSyncProcessor } from './skeleton-sync.processor';
import { SkeletonService } from './skeleton.service';
import { SKELETON_SYNC_QUEUE } from './skeleton.constants';

const PROVIDERS = [
    SkeletonService,
    SkeletonSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        SkeletonEntity
    ]),
    BullModule.registerQueue({
        name: SKELETON_SYNC_QUEUE,
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
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [SkeletonController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [SkeletonService]
})
export class SkeletonModule {}
