import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { GithubApiModule } from '../github-api/github-api.module';
import { ExerciseModule } from '../exercises/exercise.module';

import { InstructionEntity } from './entity/instruction.entity';
import { InstructionController } from './instruction.controller';
import { InstructionListener } from './instruction.listener';
import { InstructionService } from './instruction.service';
import { InstructionEmitter } from './instruction.emitter';

const PROVIDERS = [
    InstructionService,
    InstructionEmitter
];

const MODULES = [
    TypeOrmModule.forFeature([
        InstructionEntity
    ]),
    HttpModule,
    forwardRef(() => UserModule),
    GithubApiModule,
    ExerciseModule
];

@Module({
    controllers: [InstructionController, InstructionListener],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [InstructionService]
})
export class InstructionModule {}
