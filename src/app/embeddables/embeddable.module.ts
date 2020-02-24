import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { EmbeddableEntity } from './entity/embeddable.entity';
import { EmbeddableController } from './embeddable.controller';
import { EmbeddableSyncProcessor } from './embeddable-sync.processor';
import { EmbeddableService } from './embeddable.service';
import { EMBEDDABLE_SYNC_QUEUE } from './embeddable.constants';

const PROVIDERS = [
    EmbeddableService,
    EmbeddableSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        EmbeddableEntity
    ]),
    BullModule.registerQueue({
        name: EMBEDDABLE_SYNC_QUEUE,
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
    controllers: [EmbeddableController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [EmbeddableService]
})
export class EmbeddableModule {}
