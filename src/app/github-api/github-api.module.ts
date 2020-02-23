import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { GithubApiService } from './github-api.service';

const PROVIDERS = [
    GithubApiService
];

const MODULES = [
    UserModule
];

@Module({
    controllers: [],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [GithubApiService]
})
export class GithubApiModule {
}
