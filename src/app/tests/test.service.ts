import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';

import { AppLogger } from '../app.logger';
import { ResourceEntity } from '../_helpers/entity/resource.entity';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { ExerciseService } from '../exercises/exercise.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity/user.entity';

import { TestEntity } from './entity/test.entity';

@Injectable()
export class TestService {

    private logger = new AppLogger(TestService.name);

    constructor(
        @InjectRepository(TestEntity)
        protected readonly repository: Repository<TestEntity>,

        protected readonly githubApiService: GithubApiService,
        protected readonly exerciseService: ExerciseService
    ) {
    }

    public async getInputContents(user: UserEntity, id: string):
            Promise<any> {
        const entity = await this.repository.findOneOrFail(id);
        return this.getContents(user, entity, entity.input.pathname);
    }

    public async getOutputContents(user: UserEntity, id: string):
            Promise<any> {
        const entity = await this.repository.findOneOrFail(id);
        return this.getContents(user, entity, entity.output.pathname);
    }

    public async getContents(user: UserEntity, test: TestEntity, path: string):
            Promise<any> {
        const exercise = await this.exerciseService.findOne(test.exercise_id);
        let testset_path = '';
        if (test.testset_id) {
            testset_path = `testsets/${test.testset_id}/`;
        }
        try {
            const response = await this.githubApiService.getFileContents(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/${path}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${path}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<TestEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get template`, e);
        }
    }

    public async createTest(dto: TestEntity, input: any, output: any):
            Promise<TestEntity> {
        const test = await this.repository.save(plainToClass(TestEntity, dto));
        try {
            test.input = plainToClass(ResourceEntity, { pathname: input.originalname });
            test.output = plainToClass(ResourceEntity, { pathname: output.originalname });
            return await this.repository.save(test);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create test`, e);
        }
    }

    public async updateTest(id: string, dto: TestEntity, input: any, output: any):
            Promise<TestEntity> {
        const test = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        delete dto.testset_id;
        try {
            dto.input = plainToClass(ResourceEntity, { sha: test.input.sha, pathname: input.originalname });
            dto.output = plainToClass(ResourceEntity, { sha: test.output.sha, pathname: output.originalname });
            return await this.repository.save(plainToClass(TestEntity, { ...test, ...dto }));
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update test`, e);
        }
    }

    public async deleteTest(id: string):
            Promise<TestEntity> {
        const test = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete test`, e);
        }
        return test;
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'test', prop: 'tests' }
            ],
            `test.id = '${id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
