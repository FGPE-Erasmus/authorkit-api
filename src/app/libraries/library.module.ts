import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GitModule } from '../git/git.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { LIBRARY_SYNC_QUEUE } from './library.constants';
import { LibraryEntity } from './entity/library.entity';
import { LibraryController } from './library.controller';
import { LibrarySyncProcessor } from './library-sync.processor';
import { LibraryService } from './library.service';

const PROVIDERS = [
    LibraryService,
    LibrarySyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([LibraryEntity]),
    BullModule.registerQueue({
        name: LIBRARY_SYNC_QUEUE,
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
    forwardRef(() => UserModule),
    GitModule,
    forwardRef(() => ExerciseModule)
];

@Module({
    controllers: [LibraryController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [LibraryService]
})
export class LibraryModule {}
