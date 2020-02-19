import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { LibraryEntity } from './entity/library.entity';
import { LibraryController } from './library.controller';
import { LibraryListener } from './library.listener';
import { Librarieservice } from './library.service';
import { LibraryEmitter } from './library.emitter';

const PROVIDERS = [
    Librarieservice,
    LibraryEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        LibraryEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [LibraryController, LibraryListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [Librarieservice]
})
export class LibraryModule {}
