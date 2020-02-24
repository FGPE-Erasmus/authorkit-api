import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { TestGeneratorEntity } from './entity/test-generator.entity';
import { TestGeneratorController } from './test-generator.controller';
import { TestGeneratorSyncProcessor } from './test-generator-sync.processor';
import { TestGeneratorService } from './test-generator.service';
import { TEST_GENERATOR_SYNC_QUEUE } from './test-generator.constants';


const PROVIDERS = [
    TestGeneratorService,
    TestGeneratorSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        TestGeneratorEntity
    ]),
    BullModule.registerQueue({
        name: TEST_GENERATOR_SYNC_QUEUE,
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
    controllers: [TestGeneratorController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [TestGeneratorService]
})
export class TestGeneratorModule {}
