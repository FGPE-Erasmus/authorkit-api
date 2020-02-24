import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { DynamicCorrectorEntity } from './entity/dynamic-corrector.entity';
import { DynamicCorrectorController } from './dynamic-corrector.controller';
import { DynamicCorrectorService } from './dynamic-corrector.service';
import { DynamicCorrectorSyncProcessor } from './dynamic-corrector-sync.processor';
import { DYNAMIC_CORRECTOR_SYNC_QUEUE } from './dynamic-corrector.constants';

const PROVIDERS = [
    DynamicCorrectorService,
    DynamicCorrectorSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        DynamicCorrectorEntity
    ]),
    BullModule.registerQueue({
        name: DYNAMIC_CORRECTOR_SYNC_QUEUE,
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
    controllers: [DynamicCorrectorController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [DynamicCorrectorService]
})
export class DynamicCorrectorModule {}
