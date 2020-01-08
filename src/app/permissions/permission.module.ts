import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';
import { GithubApiModule } from '../github-api/github-api.module';

import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PermissionEntity } from './entity/permission.entity';

const PROVIDERS = [
    PermissionService
];

const MODULES = [
    TypeOrmModule.forFeature([PermissionEntity]),
    HttpModule,
    forwardRef(() => UserModule),
    forwardRef(() => ProjectModule),
    GithubApiModule
];

@Module({
    controllers: [PermissionController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [PermissionService]
})
export class PermissionModule {}
