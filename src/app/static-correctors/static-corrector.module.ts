import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { StaticCorrectorEntity } from './entity/static-corrector.entity';
import { StaticCorrectorController } from './static-corrector.controller';
import { StaticCorrectorService } from './static-corrector.service';
import { StaticCorrectorSyncProcessor } from './static-corrector-sync.processor';
import { STATIC_CORRECTOR_SYNC_QUEUE } from './static-corrector.constants';

const PROVIDERS = [
    StaticCorrectorService,
    StaticCorrectorSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        StaticCorrectorEntity
    ]),
    BullModule.registerQueue({
        name: STATIC_CORRECTOR_SYNC_QUEUE,
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
    forwardRef(() => ExerciseModule)
];

@Module({
    controllers: [StaticCorrectorController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [StaticCorrectorService]
})
export class StaticCorrectorModule {}
