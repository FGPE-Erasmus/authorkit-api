import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { DynamicCorrectorEntity } from './entity/dynamic-corrector.entity';
import { DynamicCorrectorController } from './dynamic-corrector.controller';
import { DynamicCorrectorListener } from './dynamic-corrector.listener';
import { DynamicCorrectorService } from './dynamic-corrector.service';
import { DynamicCorrectorEmitter } from './dynamic-corrector.emitter';

const PROVIDERS = [
    DynamicCorrectorService,
    DynamicCorrectorEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        DynamicCorrectorEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [DynamicCorrectorController, DynamicCorrectorListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [DynamicCorrectorService]
})
export class DynamicCorrectorModule {}
