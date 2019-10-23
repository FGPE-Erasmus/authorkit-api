import { Injectable, HttpService } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { AppLogger } from '../app.logger';
import { ExerciseEntity } from './entity/exercise.entity';
import {
    ExerciseDynamicCorrectorEntity,
    ExerciseEmbeddableEntity,
    ExerciseFeedbackGeneratorEntity,
    ExerciseInstructionEntity,
    ExerciseLibraryEntity,
    ExerciseSkeletonEntity,
    ExerciseSolutionEntity,
    ExerciseStatementEntity,
    ExerciseStaticCorrectorEntity,
    ExerciseTemplateEntity,
    ExerciseTestGeneratorEntity,
    ExerciseTestEntity,
    ExerciseTestSetEntity
} from './entity';

@Injectable()
export class ExerciseService extends TypeOrmCrudService<ExerciseEntity> {

    private logger = new AppLogger(ExerciseService.name);

    constructor(
        @InjectRepository(ExerciseEntity)
        protected readonly repository: Repository<ExerciseEntity>,

        @InjectRepository(ExerciseEmbeddableEntity)
        protected readonly embeddableRepository: Repository<ExerciseEmbeddableEntity>,

        @InjectRepository(ExerciseFeedbackGeneratorEntity)
        protected readonly feedbackGeneratorRepository: Repository<ExerciseFeedbackGeneratorEntity>,

        @InjectRepository(ExerciseInstructionEntity)
        protected readonly instructionRepository: Repository<ExerciseInstructionEntity>,

        @InjectRepository(ExerciseLibraryEntity)
        protected readonly libraryRepository: Repository<ExerciseLibraryEntity>,

        @InjectRepository(ExerciseSkeletonEntity)
        protected readonly skeletonRepository: Repository<ExerciseSkeletonEntity>,

        @InjectRepository(ExerciseSolutionEntity)
        protected readonly solutionRepository: Repository<ExerciseSolutionEntity>,

        @InjectRepository(ExerciseStatementEntity)
        protected readonly statementRepository: Repository<ExerciseStatementEntity>,

        @InjectRepository(ExerciseStaticCorrectorEntity)
        protected readonly staticCorrectorRepository: Repository<ExerciseStaticCorrectorEntity>,

        @InjectRepository(ExerciseDynamicCorrectorEntity)
        protected readonly dynamicCorrectorRepository: Repository<ExerciseDynamicCorrectorEntity>,

        @InjectRepository(ExerciseTemplateEntity)
        protected readonly templateRepository: Repository<ExerciseTemplateEntity>,

        @InjectRepository(ExerciseTestGeneratorEntity)
        protected readonly testGeneratorRepository: Repository<ExerciseTestGeneratorEntity>,

        @InjectRepository(ExerciseTestEntity)
        protected readonly testRepository: Repository<ExerciseTestEntity>,

        @InjectRepository(ExerciseTestSetEntity)
        protected readonly testSetRepository: Repository<ExerciseTestSetEntity>
    ) {
        super(repository);
    }

}
