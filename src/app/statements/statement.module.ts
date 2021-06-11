import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { StatementEntity } from './entity/statement.entity';
import { StatementController } from './statement.controller';
import { StatementSyncProcessor } from './statement-sync.processor';
import { StatementService } from './statement.service';
import { STATEMENT_SYNC_QUEUE } from './statement.constants';

const PROVIDERS = [
    StatementService,
    StatementSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        StatementEntity
    ]),
    BullModule.registerQueue({
        name: STATEMENT_SYNC_QUEUE,
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
    GithubApiModule,
    forwardRef(() => ExerciseModule)
];

@Module({
    controllers: [StatementController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [StatementService]
})
export class StatementModule {}
