import { Module, HttpModule, forwardRef } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';
import { GithubApiService } from './github-api.service';

const PROVIDERS = [
    GithubApiService
];

const MODULES = [
    /* HttpModule,
    forwardRef(() => UserModule),
    forwardRef(() => ProjectModule) */
];

@Module({
    controllers: [],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [GithubApiService]
})
export class GithubApiModule {
}
