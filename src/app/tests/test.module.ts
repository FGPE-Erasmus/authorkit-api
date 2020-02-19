import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';
import { TestSetModule } from '../testsets/testset.module';

import { TestEntity } from './entity/test.entity';
import { TestController } from './test.controller';
import { TestListener } from './test.listener';
import { TestService } from './test.service';
import { TestEmitter } from './test.emitter';

const PROVIDERS = [
    TestService,
    TestEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        TestEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule,
    forwardRef(() => TestSetModule)
];

@Module({
    controllers: [TestController, TestListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [TestService]
})
export class TestModule {}
