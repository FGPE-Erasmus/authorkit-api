import { forwardRef, HttpModule, Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';

import { projectUserProviders } from './project-user.providers';
import { ProjectUserService } from './project-user.service';
import { ProjectUserVoter } from './security/project-user.voter';
import { ProjectUserController } from './project-user.controller';

const PROVIDERS = [
    ...projectUserProviders,
    ProjectUserService,
    ProjectUserVoter
];

const MODULES = [
    HttpModule,
    DatabaseModule,
    UserModule,
    forwardRef(() => ProjectModule)
];

@Module({
    controllers: [ProjectUserController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ProjectUserService]
})
export class ProjectUserModule {

}
