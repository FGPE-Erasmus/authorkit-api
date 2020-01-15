import { Injectable, HttpService, InternalServerErrorException, BadRequestException, Type } from '@nestjs/common';
import { Repository, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { AppLogger } from '../app.logger';
import { getParamValueFromCrudRequest, asyncForEach } from '../_helpers';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
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
    ExerciseTestSetEntity,
    ExerciseTestEntity
} from './entity';
import { plainToClass } from 'class-transformer';
import { TestSetService } from './testsets/testset.service';
import { TestService } from './tests/test.service';

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

        protected readonly testSetService: TestSetService,

        protected readonly testService: TestService,

        protected readonly githubApiService: GithubApiService
    ) {
        super(repository);
    }

    public async getOne(req: CrudRequest): Promise<ExerciseEntity> {
        return super.getOne(req);
    }

    public async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<ExerciseEntity> | ExerciseEntity[]> {
        return super.getMany(req);
    }

    public async createOne(req: CrudRequest, dto: ExerciseEntity): Promise<ExerciseEntity> {
        return await super.createOne(req, dto);
    }

    public async updateOne(req: CrudRequest, dto: ExerciseEntity): Promise<ExerciseEntity> {
        const id = getParamValueFromCrudRequest(req, 'id');
        if (!id) {
            throw new BadRequestException('Exercise id is required.');
        }
        return await super.updateOne(req, dto);
    }

    public async replaceOne(req: CrudRequest, dto: ExerciseEntity): Promise<ExerciseEntity> {
        const id = getParamValueFromCrudRequest(req, 'id');
        if (!id) {
            throw new BadRequestException('Exercise id is required.');
        }
        return await super.replaceOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<ExerciseEntity | void> {
        const id = getParamValueFromCrudRequest(req, 'id');
        if (!id) {
            throw new BadRequestException('Exercise id is required.');
        }
        /* const exercise = await this.repository.findOneOrFail(id);
        if (exercise.dynamic_correctors) {
            await asyncForEach(
                exercise.dynamic_correctors,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.embeddables) {
            await asyncForEach(
                exercise.embeddables,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.feedback_generators) {
            await asyncForEach(
                exercise.feedback_generators,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.instructions) {
            await asyncForEach(
                exercise.instructions,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.libraries) {
            await asyncForEach(
                exercise.libraries,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.skeletons) {
            await asyncForEach(
                exercise.skeletons,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.solutions) {
            await asyncForEach(
                exercise.solutions,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.statements) {
            await asyncForEach(
                exercise.statements,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.static_correctors) {
            await asyncForEach(
                exercise.static_correctors,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.templates) {
            await asyncForEach(
                exercise.templates,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.test_generators) {
            await asyncForEach(
                exercise.test_generators,
                c => this.githubApiService.deleteExerciseFile(exercise, c));
        }
        if (exercise.test_sets) {
            await asyncForEach(
                exercise.test_sets,
                (c: ExerciseTestSetEntity) => this.testSetService.deleteFromGithub(c));
        }
        if (exercise.tests) {
            await asyncForEach(
                exercise.tests.filter(c => !c.testset_id),
                (c: ExerciseTestEntity) => this.testService.deleteFromGithub(c));
        }
        await this.githubApiService.deleteExerciseTree(exercise); */
        return super.deleteOne(req);
    }

    public async getAccessLevel(exercise_id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' }
            ],
            `exercise.id = '${exercise_id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }

    /* Extra Files */

    public async getExtraFileContents(exercise_id: string, pathname: string):
            Promise<any> {
        const exercise = await this.repository.findOneOrFail(exercise_id);
        try {
            const response = await this.githubApiService.getExerciseFileContents(
                exercise, pathname);
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${pathname}`, e);
        }
    }

    public async createExtraFile<T>(exercise_id: string, type: Type<T>, dto: any, file: any):
            Promise<any> {
        const exercise = await this.repository.findOneOrFail(exercise_id);
        const repo = this.repositoryForType(type);
        try {
            const commit_result = await this.githubApiService.createExerciseFile(
                exercise, this.nameForType(type), file);
            dto.exercise_id = exercise_id;
            dto.pathname = commit_result.content.path;
            dto.sha = commit_result.content.sha;
            return await repo.save(plainToClass(type, dto));
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create ${type.name}`, e);
        }
    }

    public async updateExtraFile<T>(exercise_id: string, id: string, type: Type<T>, dto: any, file: any):
            Promise<any> {
        const exercise = await this.repository.findOneOrFail(exercise_id);
        const repo = this.repositoryForType(type);
        const entity = await repo.findOneOrFail(id);
        try {
            const commit_result = await this.githubApiService.updateExerciseFile(
                exercise, entity, this.nameForType(type), file, entity.sha);
            dto.exercise_id = exercise_id;
            dto.pathname = commit_result.content.path;
            dto.sha = commit_result.content.sha;
            return await repo.save(plainToClass(type, { ...entity, ...dto }));
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update ${type.name}`, e);
        }
    }

    public async deleteExtraFile<T>(exercise_id: string, id: string, type: Type<T>):
            Promise<any> {
        const exercise = await this.repository.findOneOrFail(exercise_id);
        const repo = this.repositoryForType(type);
        const entity = await repo.findOneOrFail(id);
        try {
            await this.githubApiService.deleteExerciseFile(exercise, entity);
            await repo.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete ${type.name}`, e);
        }
        return entity;
    }

    private repositoryForType(type: Type<any>): Repository<any> | null {
        switch (type.name) {
            case ExerciseEmbeddableEntity.name:
                return this.embeddableRepository;
            case ExerciseFeedbackGeneratorEntity.name:
                return this.feedbackGeneratorRepository;
            case ExerciseInstructionEntity.name:
                return this.instructionRepository;
            case ExerciseLibraryEntity.name:
                return this.libraryRepository;
            case ExerciseSkeletonEntity.name:
                return this.skeletonRepository;
            case ExerciseSolutionEntity.name:
                return this.solutionRepository;
            case ExerciseStatementEntity.name:
                return this.statementRepository;
            case ExerciseStaticCorrectorEntity.name:
                return this.staticCorrectorRepository;
            case ExerciseDynamicCorrectorEntity.name:
                return this.dynamicCorrectorRepository;
            case ExerciseTemplateEntity.name:
                return this.templateRepository;
            case ExerciseTestGeneratorEntity.name:
                return this.testGeneratorRepository;
            default:
                break;
        }
        return null;
    }

    private nameForType(type: Type<any>): string {
        const name = type.name.substring('Exercise'.length, type.name.length - 'Entity'.length);
        return name
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/([0-9])([^0-9])/g, '$1-$2')
            .replace(/([^0-9])([0-9])/g, '$1-$2')
            .replace(/-+/g, '-')
            .toLowerCase();
    }
}
