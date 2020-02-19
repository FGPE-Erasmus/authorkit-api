import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { SkeletonEntity } from './entity/skeleton.entity';
import { SkeletonController } from './skeleton.controller';
import { SkeletonListener } from './skeleton.listener';
import { SkeletonService } from './skeleton.service';
import { SkeletonEmitter } from './skeleton.emitter';

const PROVIDERS = [
    SkeletonService,
    SkeletonEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        SkeletonEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [SkeletonController, SkeletonListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [SkeletonService]
})
export class SkeletonModule {}
