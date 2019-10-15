import { HttpModule, Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';

import { ProjectCommand } from './project.command';
import { projectProviders } from './project.providers';
import { ProjectPipe } from './pipe/project.pipe';
import { ProjectService } from './project.service';
import { ProjectVoter } from './security/project.voter';
import { ProjectController } from './project.controller';

const PROVIDERS = [
    ...projectProviders,
    ProjectService,
    ProjectVoter,
    ProjectCommand,
    ProjectPipe
];

const MODULES = [
    HttpModule,
    DatabaseModule,
    UserModule
    // forwardRef(() => ProjectUserModule)
];

@Module({
    controllers: [ProjectController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [ProjectService]
})
export class ProjectModule {

}
