import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { SolutionEntity } from './entity/solution.entity';
import { SolutionController } from './solution.controller';
import { SolutionListener } from './solution.listener';
import { SolutionService } from './solution.service';
import { SolutionEmitter } from './solution.emitter';

const PROVIDERS = [
    SolutionService,
    SolutionEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        SolutionEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [SolutionController, SolutionListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [SolutionService]
})
export class SolutionModule {}
