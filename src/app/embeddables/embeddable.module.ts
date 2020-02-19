import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { EmbeddableEntity } from './entity/embeddable.entity';
import { EmbeddableController } from './embeddable.controller';
import { EmbeddableListener } from './embeddable.listener';
import { EmbeddableService } from './embeddable.service';
import { EmbeddableEmitter } from './embeddable.emitter';

const PROVIDERS = [
    EmbeddableService,
    EmbeddableEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        EmbeddableEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [EmbeddableController, EmbeddableListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [EmbeddableService]
})
export class EmbeddableModule {}
