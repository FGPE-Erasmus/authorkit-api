import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { TemplateEntity } from './entity/template.entity';
import { TemplateController } from './template.controller';
import { TemplateListener } from './template.listener';
import { TemplateService } from './template.service';
import { TemplateEmitter } from './template.emitter';

const PROVIDERS = [
    TemplateService,
    TemplateEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        TemplateEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [TemplateController, TemplateListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [TemplateService]
})
export class TemplateModule {}
