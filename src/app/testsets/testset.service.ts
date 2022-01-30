import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Repository, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GitService } from '../git/git.service';
import { ExerciseEntity } from '../exercises/entity/exercise.entity';
import { ExerciseService } from '../exercises/exercise.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity/user.entity';
import { TestService } from '../tests/test.service';

import { TestSetEntity } from './entity/testset.entity';
import { TESTSET_SYNC_QUEUE, TESTSET_SYNC_CREATE } from './testset.constants';

@Injectable()
export class TestSetService extends TypeOrmCrudService<TestSetEntity> {
    constructor(
        @InjectRepository(TestSetEntity)
        protected readonly repository: Repository<TestSetEntity>,

        @InjectQueue(TESTSET_SYNC_QUEUE)
        private readonly testsetSyncQueue: Queue,

        protected readonly gitService: GitService,

        @Inject(forwardRef(() => ExerciseService))
        protected readonly exerciseService: ExerciseService,

        @Inject(forwardRef(() => TestService))
        protected readonly testService: TestService
    ) {
        super(repository);
    }

    public async createOne(
        req: CrudRequest,
        dto: DeepPartial<TestSetEntity>
    ): Promise<TestSetEntity> {
        return await super.createOne(req, dto);
    }

    public async updateOne(
        req: CrudRequest,
        dto: DeepPartial<TestSetEntity>
    ): Promise<TestSetEntity> {
        return super.updateOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<void | TestSetEntity> {
        return await super.deleteOne(req);
    }

    public async importProcessEntries(
        user: UserEntity,
        exercise: ExerciseEntity,
        entries: any
    ): Promise<void> {
        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            throw new BadRequestException('Archive misses required metadata');
        }

        const entity = await this.importMetadataFile(
            user,
            exercise,
            root_metadata
        );

        const result = Object.keys(entries).reduce(function (acc, curr) {
            const match = curr.match('^tests/([0-9a-zA-Z-]+)/(.*)$');
            if (!match) {
                return acc;
            }
            if (!acc[match[1]]) {
                acc[match[1]] = {};
            }
            acc[match[1]][match[2]] = entries[curr];
            return acc;
        }, {});

        const asyncImporters = [];

        Object.keys(result).forEach((related_entity_key) => {
            asyncImporters.push(
                this.testService.importProcessEntries(
                    user,
                    exercise,
                    result[related_entity_key],
                    entity
                )
            );
        });

        await Promise.all(asyncImporters);
    }

    public async importMetadataFile(
        user: UserEntity,
        exercise: ExerciseEntity,
        metadataFile: any
    ): Promise<TestSetEntity> {
        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: TestSetEntity = await this.repository.save({
            name: metadata.name,
            weight: metadata.weight,
            visible: metadata.visible,
            exercise_id: exercise.id
        });

        this.testsetSyncQueue.add(TESTSET_SYNC_CREATE, {
            user,
            testset: entity
        });

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
                {
                    src_table: 'exercise',
                    dst_table: 'testset',
                    prop: 'test_sets'
                }
            ],
            `testset.id = '${id}'`,
            `permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
