import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GitModule } from '../git/git.module';
import { ExerciseModule } from '../exercises/exercise.module';
import { TestModule } from '../tests/test.module';

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
    TypeOrmModule.forFeature([TestSetEntity]),
    BullModule.registerQueue({
        name: TESTSET_SYNC_QUEUE,
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
    UserModule,
    GitModule,
    forwardRef(() => ExerciseModule),
    forwardRef(() => TestModule)
];

@Module({
    controllers: [TestSetController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [TestSetService, TestSetSyncProcessor]
})
export class TestSetModule {}
