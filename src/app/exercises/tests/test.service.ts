import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';

import { AppLogger } from '../../app.logger';
import { GithubApiService } from '../../github-api/github-api.service';
import { ExerciseEntity } from '../entity/exercise.entity';
import { ExerciseTestEntity } from '../entity/exercise-test.entity';
import { ExerciseTestSetEntity } from '../entity/exercise-test-set.entity';
import { ResourceEntity } from '../../_helpers/entity/resource.entity';

@Injectable()
export class TestService {

    private logger = new AppLogger(TestService.name);

    constructor(
        @InjectRepository(ExerciseTestEntity)
        protected readonly repository: Repository<ExerciseTestEntity>,

        @InjectRepository(ExerciseEntity)
        protected readonly exerciseRepository: Repository<ExerciseEntity>,

        @InjectRepository(ExerciseTestSetEntity)
        protected readonly testSetRepository: Repository<ExerciseTestSetEntity>,

        protected readonly githubApiService: GithubApiService
    ) {
    }

    public async createTest(exercise_id: string, dto: ExerciseTestEntity, input: any, output: any):
            Promise<ExerciseTestEntity> {
        const exercise = await this.exerciseRepository.findOneOrFail(exercise_id);
        let testset_path = '';
        if (dto.testset_id) {
            const testset = await this.testSetRepository.findOneOrFail(dto.testset_id);
            testset_path = `testset/${testset.id}/`;
        }
        dto.exercise_id = exercise_id;
        const test = await this.repository.save(plainToClass(ExerciseTestEntity, dto));
        testset_path += `test/${test.id}`;
        try {
            const input_result = await this.githubApiService.createExerciseFile(
                exercise, testset_path, input);
            const output_result = await this.githubApiService.createExerciseFile(
                exercise, testset_path, output);
            test.input = plainToClass(ResourceEntity, { pathname: input_result.content.path, sha: input_result.content.sha });
            test.output = plainToClass(ResourceEntity, { pathname: output_result.content.path, sha: output_result.content.sha });
            return await this.repository.save(test);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create test`, e);
        }
    }

    public async updateTest(exercise_id: string, id: string, dto: ExerciseTestEntity, input: any, output: any):
            Promise<ExerciseTestEntity> {
        const exercise = await this.exerciseRepository.findOneOrFail(exercise_id);
        const test = await this.repository.findOneOrFail(id);
        let testset_path = '';
        if (test.testset_id) {
            const testset = await this.testSetRepository.findOneOrFail(test.testset_id);
            testset_path = `testset/${testset.id}/`;
        }
        testset_path += `test/${test.id}`;
        delete dto.exercise_id;
        delete dto.testset_id;
        try {
            const input_result = await this.githubApiService.updateExerciseFile(
                exercise, test.input, testset_path, input, test.input.sha);
            const output_result = await this.githubApiService.updateExerciseFile(
                exercise, test.output, testset_path, output, test.output.sha);
            dto.input = plainToClass(ResourceEntity, { pathname: input_result.content.path, sha: input_result.content.sha });
            dto.output = plainToClass(ResourceEntity, { pathname: output_result.content.path, sha: output_result.content.sha });
            return await this.repository.save(plainToClass(ExerciseTestEntity, { ...test, ...dto }));
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update test`, e);
        }
    }

    public async deleteTest(id: string):
            Promise<ExerciseTestEntity> {
        const test = await this.repository.findOneOrFail(id);
        try {
            await this.deleteFromGithub(test);
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete test`, e);
        }
        return test;
    }

    public async deleteFromGithub(test: ExerciseTestEntity) {
        const exercise = await this.exerciseRepository.findOneOrFail(test.exercise_id);
        try {
            if (test.input) {
                await this.githubApiService.deleteExerciseFile(exercise, test.input);
            }
            if (test.output) {
                await this.githubApiService.deleteExerciseFile(exercise, test.output);
            }
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete test files`, e);
        }
    }
}
