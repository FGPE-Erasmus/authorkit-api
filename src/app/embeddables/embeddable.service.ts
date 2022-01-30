import { Injectable, InternalServerErrorException, forwardRef, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GitService } from '../git/git.service';
import { ExerciseService } from '../exercises/exercise.service';
import { ExerciseEntity } from '../exercises/entity/exercise.entity';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity';

import {
    EMBEDDABLE_SYNC_QUEUE,
    EMBEDDABLE_SYNC_CREATE,
    EMBEDDABLE_SYNC_UPDATE,
    EMBEDDABLE_SYNC_DELETE,
    EMBEDDABLE_SYNC_CREATE_FILE,
    EMBEDDABLE_SYNC_UPDATE_FILE
} from './embeddable.constants';
import { EmbeddableEntity } from './entity/embeddable.entity';


@Injectable()
export class EmbeddableService {
    private logger = new AppLogger(EmbeddableService.name);

    constructor(
        @InjectRepository(EmbeddableEntity)
        protected readonly repository: Repository<EmbeddableEntity>,

        @InjectQueue(EMBEDDABLE_SYNC_QUEUE)
        private readonly embeddableSyncQueue: Queue,

        protected readonly gitService: GitService,

        @Inject(forwardRef(() => ExerciseService))
        protected readonly exerciseService: ExerciseService
    ) {}

    public async getContents(user: UserEntity, id: string): Promise<any> {
        const entity = await this.repository.findOneOrFail(id);
        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        try {
            const response = await this.gitService.getFileContents(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/embeddables/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(
                `Failed to read ${entity.pathname}`,
                e
            );
        }
    }

    public async getOne(
        user: UserEntity,
        id: string
    ): Promise<EmbeddableEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(
                `Failed to get embeddable`,
                e
            );
        }
    }

    public async createOne(
        user: UserEntity,
        dto: EmbeddableEntity,
        file: any
    ): Promise<EmbeddableEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(EmbeddableEntity, dto)
            );
            this.embeddableSyncQueue.add(EMBEDDABLE_SYNC_CREATE, {
                user,
                entity
            });
            this.embeddableSyncQueue.add(
                EMBEDDABLE_SYNC_CREATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(
                `Failed to create embeddable`,
                e
            );
        }
    }

    public async updateOne(
        user: UserEntity,
        id: string,
        dto: EmbeddableEntity,
        file: any
    ): Promise<EmbeddableEntity> {
        const embeddable = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(EmbeddableEntity, { ...embeddable, ...dto })
            );
            this.embeddableSyncQueue.add(EMBEDDABLE_SYNC_UPDATE, {
                user,
                entity
            });
            this.embeddableSyncQueue.add(
                EMBEDDABLE_SYNC_UPDATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(
                `Failed to update embeddable`,
                e
            );
        }
    }

    public async deleteOne(
        user: UserEntity,
        id: string
    ): Promise<EmbeddableEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(
                `Failed to delete embeddable`,
                e
            );
        }
        this.embeddableSyncQueue.add(EMBEDDABLE_SYNC_DELETE, { user, entity });
        return entity;
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

        if (!entries[entity.pathname]) {
            throw new BadRequestException('Archive misses referenced file');
        }

        this.embeddableSyncQueue.add(
            EMBEDDABLE_SYNC_CREATE_FILE,
            {
                user,
                entity,
                file: { buffer: await entries[entity.pathname].buffer() }
            },
            { delay: 1000 }
        );
    }

    public async importMetadataFile(
        user: UserEntity,
        exercise: ExerciseEntity,
        metadataFile: any
    ): Promise<EmbeddableEntity> {
        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: EmbeddableEntity = await this.repository.save({
            pathname: metadata.pathname,
            exercise_id: exercise.id
        });

        this.embeddableSyncQueue.add(EMBEDDABLE_SYNC_CREATE, { user, entity });

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
                    dst_table: 'embeddable',
                    prop: 'embeddables'
                }
            ],
            `embeddable.id = '${id}'`,
            `permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
