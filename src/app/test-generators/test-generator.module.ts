import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { TestGeneratorEntity } from './entity/test-generator.entity';
import { TestGeneratorController } from './test-generator.controller';
import { TestGeneratorListener } from './test-generator.listener';
import { TestGeneratorService } from './test-generator.service';
import { TestGeneratorEmitter } from './test-generator.emitter';

const PROVIDERS = [
    TestGeneratorService,
    TestGeneratorEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        TestGeneratorEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [TestGeneratorController, TestGeneratorListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [TestGeneratorService]
})
export class TestGeneratorModule {}
