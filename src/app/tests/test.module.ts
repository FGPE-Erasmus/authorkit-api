import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';
import { TestSetModule } from '../testsets/testset.module';

import { TEST_SYNC_QUEUE } from './test.constants';
import { TestEntity } from './entity/test.entity';
import { TestController } from './test.controller';
import { TestSyncProcessor } from './test-sync.processor';
import { TestService } from './test.service';

const PROVIDERS = [
    TestService,
    TestSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        TestEntity
    ]),
    BullModule.registerQueue({
        name: TEST_SYNC_QUEUE,
        redis: {
          host: config.queueing.host,
          port: config.queueing.port
        },
        defaultJobOptions: {
            attempts: 20,
            backoff: {
                type: 'exponential',
                delay: 500
            },
            lifo: true,
            removeOnComplete: true
        }
    }),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    forwardRef(() => ExerciseModule),
    forwardRef(() => TestSetModule)
];

@Module({
    controllers: [TestController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [TestService, TestSyncProcessor]
})
export class TestModule {}
