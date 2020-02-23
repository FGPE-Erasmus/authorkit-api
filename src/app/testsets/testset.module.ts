import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { TestSetEntity } from './entity/testset.entity';
import { TestSetController } from './testset.controller';
import { TestSetService } from './testset.service';
import { TestSetSyncProcessor } from './testset-sync.processor';
import { TESTSET_SYNC_QUEUE } from './testset.constants';

const PROVIDERS = [
    TestSetService,
    TestSetSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        TestSetEntity
    ]),
    BullModule.registerQueue({
        name: TESTSET_SYNC_QUEUE,
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
    UserModule,
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [TestSetController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [TestSetService, TestSetSyncProcessor]
})
export class TestSetModule {}
