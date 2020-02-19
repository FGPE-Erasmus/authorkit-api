import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { StatementEntity } from './entity/statement.entity';
import { StatementController } from './statement.controller';
import { StatementListener } from './statement.listener';
import { StatementService } from './statement.service';
import { StatementEmitter } from './statement.emitter';

const PROVIDERS = [
    StatementService,
    StatementEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        StatementEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [StatementController, StatementListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [StatementService]
})
export class StatementModule {}
