import { Injectable, InternalServerErrorException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { ExerciseEntity } from '../exercises/entity/exercise.entity';
import { ExerciseService } from '../exercises/exercise.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity';

import {
    SKELETON_SYNC_QUEUE,
    SKELETON_SYNC_CREATE,
    SKELETON_SYNC_UPDATE,
    SKELETON_SYNC_DELETE,
    SKELETON_SYNC_CREATE_FILE,
    SKELETON_SYNC_UPDATE_FILE
} from './skeleton.constants';
import { SkeletonEntity } from './entity/skeleton.entity';


@Injectable()
export class SkeletonService {

    private logger = new AppLogger(SkeletonService.name);

    constructor(
        @InjectRepository(SkeletonEntity)
        protected readonly repository: Repository<SkeletonEntity>,

        @InjectQueue(SKELETON_SYNC_QUEUE) private readonly skeletonSyncQueue: Queue,

        protected readonly githubApiService: GithubApiService,

        @Inject(forwardRef(() => ExerciseService))
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
                `exercises/${exercise.id}/skeletons/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${entity.pathname}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<SkeletonEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get skeleton`, e);
        }
    }

    public async createOne(user: UserEntity, dto: SkeletonEntity, file: any):
            Promise<SkeletonEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(plainToClass(SkeletonEntity, dto));
            this.skeletonSyncQueue.add(SKELETON_SYNC_CREATE, { user, entity });
            this.skeletonSyncQueue.add(
                SKELETON_SYNC_CREATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create skeleton`, e);
        }
    }

    public async updateOne(user: UserEntity, id: string, dto: SkeletonEntity, file: any):
            Promise<SkeletonEntity> {
        const skeleton = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(SkeletonEntity, { ...skeleton, ...dto })
            );
            this.skeletonSyncQueue.add(SKELETON_SYNC_UPDATE, { user, entity });
            this.skeletonSyncQueue.add(
                SKELETON_SYNC_UPDATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update skeleton`, e);
        }
    }

    public async deleteOne(user: UserEntity, id: string): Promise<SkeletonEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete skeleton`, e);
        }
        this.skeletonSyncQueue.add(SKELETON_SYNC_DELETE, { user, entity });
        return entity;
    }

    public async importProcessEntries(
        user: UserEntity, exercise: ExerciseEntity, entries: any
    ): Promise<void> {

        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            throw new BadRequestException('Archive misses required metadata');
        }

        const entity = await this.importMetadataFile(user, exercise, root_metadata);

        if (!entries[entity.pathname]) {
            throw new BadRequestException('Archive misses referenced file');
        }

        this.skeletonSyncQueue.add(
            SKELETON_SYNC_CREATE_FILE,
            {
                user, entity, file: { buffer: (await entries[entity.pathname].buffer()) }
            },
            { delay: 1000 }
        );
    }

    public async importMetadataFile(
        user: UserEntity, exercise: ExerciseEntity, metadataFile: any
    ): Promise<SkeletonEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: SkeletonEntity = await this.repository.save({
            lang: metadata.lang,
            pathname: metadata.pathname,
            exercise_id: exercise.id
        });

        this.skeletonSyncQueue.add(
            SKELETON_SYNC_CREATE, { user, entity }
        );

        return entity;
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'skeleton', prop: 'skeletons' }
            ],
            `skeleton.id = '${id}'`,
            `permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
