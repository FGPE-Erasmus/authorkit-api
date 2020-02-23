import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { ExerciseService } from '../exercises/exercise.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity';

import {
    TEST_GENERATOR_SYNC_QUEUE,
    TEST_GENERATOR_SYNC_CREATE,
    TEST_GENERATOR_SYNC_UPDATE,
    TEST_GENERATOR_SYNC_DELETE
} from './test-generator.constants';
import { TestGeneratorEntity } from './entity/test-generator.entity';


@Injectable()
export class TestGeneratorService {

    private logger = new AppLogger(TestGeneratorService.name);

    constructor(
        @InjectRepository(TestGeneratorEntity)
        protected readonly repository: Repository<TestGeneratorEntity>,

        @InjectQueue(TEST_GENERATOR_SYNC_QUEUE) private readonly testGeneratorSyncQueue: Queue,

        protected readonly githubApiService: GithubApiService,
        protected readonly exerciseService: ExerciseService
    ) {
    }

    public async getContents(user: UserEntity, id: string):
            Promise<any> {
        const entity = await this.repository.findOneOrFail(id);
        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        try {
            const response = await this.githubApiService.getFileContents(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/test-generators/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${entity.pathname}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<TestGeneratorEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get test generator`, e);
        }
    }

    public async createOne(user: UserEntity, dto: TestGeneratorEntity, file: any):
            Promise<TestGeneratorEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(plainToClass(TestGeneratorEntity, dto));
            this.testGeneratorSyncQueue.add(
                TEST_GENERATOR_SYNC_CREATE, { user, entity, file }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create test generator`, e);
        }
    }

    public async updateOne(user: UserEntity, id: string, dto: TestGeneratorEntity, file: any):
            Promise<TestGeneratorEntity> {
        const test_generator = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(TestGeneratorEntity, { ...test_generator, ...dto })
            );
            this.testGeneratorSyncQueue.add(
                TEST_GENERATOR_SYNC_UPDATE, { user, entity, file }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update test generator`, e);
        }
    }

    public async deleteOne(user: UserEntity, id: string): Promise<TestGeneratorEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete test generator`, e);
        }
        this.testGeneratorSyncQueue.add(
            TEST_GENERATOR_SYNC_DELETE, { user, entity }
        );
        return entity;
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'test_generator', prop: 'test_generators' }
            ],
            `test_generator.id = '${id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
