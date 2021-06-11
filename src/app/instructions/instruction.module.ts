import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { INSTRUCTION_SYNC_QUEUE } from './instruction.constants';
import { InstructionEntity } from './entity/instruction.entity';
import { InstructionController } from './instruction.controller';
import { InstructionSyncProcessor } from './instruction-sync.processor';
import { InstructionService } from './instruction.service';


const PROVIDERS = [
    InstructionService,
    InstructionSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        InstructionEntity
    ]),
    BullModule.registerQueue({
        name: INSTRUCTION_SYNC_QUEUE,
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
    controllers: [InstructionController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [InstructionService]
})
export class InstructionModule {}
