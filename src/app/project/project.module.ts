import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { accessRules } from '../app.access-rules';
import { AccessControlModule } from '../access-control/access-control.module';
import { PermissionModule } from '../permissions/permission.module';
import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';

import { ProjectCommand } from './project.command';
import { ProjectPipe } from './pipe/project.pipe';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectContextMiddleware } from './project-context.middleware';
import { ProjectEntity } from './entity/project.entity';

const PROVIDERS = [
    ProjectService,
    ProjectCommand,
    ProjectPipe,
    ProjectContextMiddleware
];

const MODULES = [
    TypeOrmModule.forFeature([ProjectEntity]),
    AccessControlModule.forRoles(accessRules),
    HttpModule,
    forwardRef(() => PermissionModule),
    UserModule,
    GithubApiModule
];

@Module({
    controllers: [ProjectController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ProjectService]
})
export class ProjectModule {}
