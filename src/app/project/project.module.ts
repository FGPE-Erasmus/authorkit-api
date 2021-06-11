import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { config } from '../../config';
import { PermissionModule } from '../permissions/permission.module';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';
import { GamificationLayerModule } from '../gamification-layers/gamification-layer.module';

import { ProjectPipe } from './pipe/project.pipe';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectEntity } from './entity/project.entity';
import { PROJECT_SYNC_QUEUE } from './project.constants';
import { ProjectSyncProcessor } from './project-sync.processor';


const PROVIDERS = [
    ProjectService,
    ProjectPipe,
    ProjectSyncProcessor
];

const MODULES = [
    TypeOrmModule.forFeature([ProjectEntity]),
    BullModule.registerQueue({
        name: PROJECT_SYNC_QUEUE,
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
    forwardRef(() => PermissionModule),
    UserModule,
    GithubApiModule,

    forwardRef(() => ExerciseModule),
    forwardRef(() => GamificationLayerModule)
];

@Module({
    controllers: [ProjectController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ProjectService]
})
export class ProjectModule {}
