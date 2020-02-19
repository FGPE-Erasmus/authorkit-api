import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { getParamValueFromCrudRequest } from '../_helpers';
import { GithubApiService } from '../github-api/github-api.service';

import { TestSetEntity } from './entity/testset.entity';

@Injectable()
export class TestSetService extends TypeOrmCrudService<TestSetEntity> {

    constructor(
        @InjectRepository(TestSetEntity)
        protected readonly repository: Repository<TestSetEntity>,

        protected readonly githubApiService: GithubApiService
    ) {
        super(repository);
    }

    public async createOne(req: CrudRequest, dto: DeepPartial<TestSetEntity>): Promise<TestSetEntity> {
        const exercise_id = getParamValueFromCrudRequest(req, 'exercise_id');
        if (!exercise_id) {
            throw new BadRequestException('Exercise id is required.');
        }
        dto.exercise_id = exercise_id;
        return super.createOne(req, dto);
    }

    public async updateOne(req: CrudRequest, dto: DeepPartial<TestSetEntity>): Promise<TestSetEntity> {
        const exercise_id = getParamValueFromCrudRequest(req, 'exercise_id');
        if (!exercise_id) {
            throw new BadRequestException('Exercise id is required.');
        }
        dto.exercise_id = exercise_id;
        return super.updateOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<void | TestSetEntity> {
        const id = getParamValueFromCrudRequest(req, 'id');
        if (!id) {
            throw new BadRequestException('Exercise id is required.');
        }
        // const testset = await this.repository.findOneOrFail(id);
        // await this.deleteFromGithub(testset);
        return await super.deleteOne(req);
    }

   /*  public async deleteFromGithub(testset: ExerciseTestSetEntity) {
        const exercise = await this.exerciseRepository.findOneOrFail(testset.exercise_id);
        try {
            if (testset.tests) {
                await asyncForEach(testset.tests, async (test: ExerciseTestEntity) => {
                    if (test.input) {
                        await this.githubApiService.deleteExerciseFile(exercise, test.input);
                    }
                    if (test.output) {
                        await this.githubApiService.deleteExerciseFile(exercise, test.output);
                    }
                });
            }
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete testset`, e);
        }
    } */
}
