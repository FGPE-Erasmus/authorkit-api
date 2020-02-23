import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { TemplateEntity } from './entity/template.entity';
import { TemplateController } from './template.controller';
import { TemplateSyncProcessor } from './template-sync.processor';
import { TemplateService } from './template.service';
import { TEMPLATE_SYNC_QUEUE } from './template.constants';

const PROVIDERS = [
    TemplateService,
    TemplateSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([
        TemplateEntity
    ]),
    BullModule.registerQueue({
        name: TEMPLATE_SYNC_QUEUE,
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
    controllers: [TemplateController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [TemplateService]
})
export class TemplateModule {}
