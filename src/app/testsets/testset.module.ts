import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { TestSetEntity } from './entity/testset.entity';
import { TestSetController } from './testset.controller';
import { TestSetListener } from './testset.listener';
import { TestSetService } from './testset.service';
import { TestSetEmitter } from './testset.emitter';

const PROVIDERS = [
    TestSetService,
    TestSetEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        TestSetEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [TestSetController, TestSetListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [TestSetService]
})
export class TestSetModule {}
