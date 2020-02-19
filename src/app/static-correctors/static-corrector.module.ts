import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { StaticCorrectorEntity } from './entity/static-corrector.entity';
import { StaticCorrectorController } from './static-corrector.controller';
import { StaticCorrectorListener } from './static-corrector.listener';
import { StaticCorrectorService } from './static-corrector.service';
import { StaticCorrectorEmitter } from './static-corrector.emitter';

const PROVIDERS = [
    StaticCorrectorService,
    StaticCorrectorEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        StaticCorrectorEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [StaticCorrectorController, StaticCorrectorListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [StaticCorrectorService]
})
export class StaticCorrectorModule {}
