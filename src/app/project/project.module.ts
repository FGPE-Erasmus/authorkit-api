import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { AccessControlModule } from '../access-control/access-control.module';
import { accessRules } from '../app.access-rules';

import { ProjectCommand } from './project.command';
import { ProjectPipe } from './pipe/project.pipe';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectContextMiddleware } from './project-context.middleware';
import { ProjectEntity, PermissionEntity } from './entity';

const PROVIDERS = [
    ProjectService,
    ProjectCommand,
    ProjectPipe,
    ProjectContextMiddleware
];

const MODULES = [
    TypeOrmModule.forFeature([ProjectEntity, PermissionEntity]),
    AccessControlModule.forRoles(accessRules),
    HttpModule,
    UserModule
];

@Module({
    controllers: [ProjectController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ProjectService]
})
export class ProjectModule {}
