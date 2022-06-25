import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { GitService } from './git.service';

const PROVIDERS = [GitService];

const MODULES = [UserModule];

@Module({
    controllers: [],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [GitService]
})
export class GitModule {}
