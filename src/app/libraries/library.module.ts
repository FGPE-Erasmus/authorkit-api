import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { LIBRARY_SYNC_QUEUE } from './library.constants';
import { LibraryEntity } from './entity/library.entity';
import { LibraryController } from './library.controller';
import { LibrarySyncProcessor } from './library-sync.processor';
import { Librarieservice } from './library.service';

const PROVIDERS = [
    Librarieservice,
    LibrarySyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        LibraryEntity
    ]),
    BullModule.registerQueue({
        name: LIBRARY_SYNC_QUEUE,
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
    controllers: [LibraryController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [Librarieservice]
})
export class LibraryModule {}
