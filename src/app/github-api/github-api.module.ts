import { Module } from '@nestjs/common';

import { GithubApiService } from './github-api.service';

@Module({
    controllers: [],
    providers: [GithubApiService],
    imports: [],
    exports: [GithubApiService]
})
export class GithubApiModule {
}
