import { Injectable, InternalServerErrorException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GitService } from '../git/git.service';
import { ExerciseEntity } from '../exercises/entity/exercise.entity';
import { ExerciseService } from '../exercises/exercise.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { TestSetEntity } from '../testsets/entity/testset.entity';
import { UserEntity } from '../user/entity/user.entity';

import { TestEntity } from './entity/test.entity';
import {
    TEST_SYNC_QUEUE,
    TEST_SYNC_CREATE,
    TEST_INPUT_SYNC_CREATE,
    TEST_OUTPUT_SYNC_CREATE,
    TEST_SYNC_UPDATE,
    TEST_INPUT_SYNC_UPDATE,
    TEST_OUTPUT_SYNC_UPDATE,
    TEST_SYNC_DELETE
} from './test.constants';

@Injectable()
export class TestService {
    private logger = new AppLogger(TestService.name);

    constructor(
        @InjectRepository(TestEntity)
        protected readonly repository: Repository<TestEntity>,

        @InjectQueue(TEST_SYNC_QUEUE) private readonly testSyncQueue: Queue,

        protected readonly gitService: GitService,

        @Inject(forwardRef(() => ExerciseService))
        protected readonly exerciseService: ExerciseService
    ) {}

    public async getInputContents(user: UserEntity, id: string): Promise<any> {
        const entity = await this.repository.findOneOrFail(id);
        return this.getContents(user, entity, entity.input.pathname);
    }

    public async getOutputContents(user: UserEntity, id: string): Promise<any> {
        const entity = await this.repository.findOneOrFail(id);
        return this.getContents(user, entity, entity.output.pathname);
    }

    public async getContents(
        user: UserEntity,
        test: TestEntity,
        path: string
    ): Promise<any> {
        const exercise = await this.exerciseService.findOne(test.exercise_id);
        let testset_path = '';
        if (test.testset_id) {
            testset_path = `testsets/${test.testset_id}/`;
        }
        try {
            const response = await this.gitService.getFileContents(
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

    public async createTest(
        user: UserEntity,
        dto: TestEntity,
        input: any,
        output: any
    ): Promise<TestEntity> {
        const test = await this.repository.save(
            plainToClass(TestEntity, {
                ...dto,
                input: {
                    pathname: input.originalname
                },
                output: {
                    pathname: output.originalname
                }
            })
        );

        this.testSyncQueue.add(TEST_SYNC_CREATE, {
            user,
            test
        });
        this.testSyncQueue.add(
            TEST_INPUT_SYNC_CREATE,
            {
                user,
                test,
                content: input
            },
            { delay: 1000 }
        );
        this.testSyncQueue.add(
            TEST_OUTPUT_SYNC_CREATE,
            {
                user,
                test,
                content: output
            },
            { delay: 1500 }
        );

        return test;
    }

    public async updateTest(
        user: UserEntity,
        id: string,
        dto: TestEntity,
        input: any,
        output: any
    ): Promise<TestEntity> {
        const oldTest = await this.repository.findOneOrFail(id);

        delete dto.exercise_id;
        delete dto.testset_id;

        const test = await this.repository.save(
            plainToClass(TestEntity, {
                ...oldTest,
                ...dto,
                input: { sha: oldTest.input.sha, pathname: input.originalname },
                output: {
                    sha: oldTest.output.sha,
                    pathname: output.originalname
                }
            })
        );

        this.testSyncQueue.add(TEST_SYNC_UPDATE, {
            user,
            test
        });
        this.testSyncQueue.add(
            TEST_INPUT_SYNC_UPDATE,
            {
                user,
                test,
                content: input
            },
            { delay: 1000 }
        );
        this.testSyncQueue.add(
            TEST_OUTPUT_SYNC_UPDATE,
            {
                user,
                test,
                content: output
            },
            { delay: 1500 }
        );

        return test;
    }

    public async deleteTest(user: UserEntity, id: string): Promise<TestEntity> {
        const test = await this.repository.findOneOrFail(id);

        await this.repository.delete(id);

        this.testSyncQueue.add(TEST_SYNC_DELETE, {
            user,
            test
        });

        return test;
    }

    public async importProcessEntries(
        user: UserEntity,
        exercise: ExerciseEntity,
        entries: any,
        testset?: TestSetEntity
    ): Promise<void> {
        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            throw new BadRequestException('Archive misses required metadata');
        }

        const entity = await this.importMetadataFile(
            user,
            exercise,
            root_metadata,
            testset
        );

        if (!entries[entity.input.pathname]) {
            throw new BadRequestException('Archive misses referenced file');
        }

        this.testSyncQueue.add(
            TEST_INPUT_SYNC_CREATE,
            {
                user,
                test: entity,
                content: {
                    buffer: await entries[entity.input.pathname].buffer()
                }
            },
            { delay: 1000 }
        );

        if (!entries[entity.output.pathname]) {
            throw new BadRequestException('Archive misses referenced file');
        }

        this.testSyncQueue.add(
            TEST_OUTPUT_SYNC_CREATE,
            {
                user,
                test: entity,
                content: {
                    buffer: await entries[entity.output.pathname].buffer()
                }
            },
            { delay: 1500 }
        );
    }

    public async importMetadataFile(
        user: UserEntity,
        exercise: ExerciseEntity,
        metadataFile: any,
        testset?: TestSetEntity
    ): Promise<TestEntity> {
        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: TestEntity = await this.repository.save({
            input: {
                pathname: metadata.input
            },
            output: {
                pathname: metadata.output
            },
            arguments: metadata.arguments,
            weight: metadata.weight,
            visible: metadata.visible,
            testset_id: testset ? testset.id : undefined,
            exercise_id: exercise.id
        });

        this.testSyncQueue.add(TEST_SYNC_CREATE, { user, test: entity });

        return entity;
    }

    public async getAccessLevel(
        id: string,
        user_id: string
    ): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                {
                    src_table: 'project',
                    dst_table: 'exercise',
                    prop: 'exercises'
                },
                { src_table: 'exercise', dst_table: 'test', prop: 'tests' }
            ],
            `test.id = '${id}'`,
            `permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
