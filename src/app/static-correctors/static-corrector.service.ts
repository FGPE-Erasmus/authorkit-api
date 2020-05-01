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
    STATIC_CORRECTOR_SYNC_QUEUE,
    STATIC_CORRECTOR_SYNC_CREATE,
    STATIC_CORRECTOR_SYNC_UPDATE,
    STATIC_CORRECTOR_SYNC_DELETE,
    STATIC_CORRECTOR_SYNC_CREATE_FILE,
    STATIC_CORRECTOR_SYNC_UPDATE_FILE
} from './static-corrector.constants';
import { StaticCorrectorEntity } from './entity/static-corrector.entity';


@Injectable()
export class StaticCorrectorService {

    private logger = new AppLogger(StaticCorrectorService.name);

    constructor(
        @InjectRepository(StaticCorrectorEntity)
        protected readonly repository: Repository<StaticCorrectorEntity>,

        @InjectQueue(STATIC_CORRECTOR_SYNC_QUEUE) private readonly staticCorrectorSyncQueue: Queue,

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
                `exercises/${exercise.id}/static-correctors/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${entity.pathname}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<StaticCorrectorEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get static corrector`, e);
        }
    }

    public async createOne(user: UserEntity, dto: StaticCorrectorEntity, file: any):
            Promise<StaticCorrectorEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(plainToClass(StaticCorrectorEntity, dto));
            this.staticCorrectorSyncQueue.add(
                STATIC_CORRECTOR_SYNC_CREATE, { user, entity }
            );
            this.staticCorrectorSyncQueue.add(
                STATIC_CORRECTOR_SYNC_CREATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create static corrector`, e);
        }
    }

    public async updateOne(user: UserEntity, id: string, dto: StaticCorrectorEntity, file: any):
            Promise<StaticCorrectorEntity> {
        const static_corrector = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(StaticCorrectorEntity, { ...static_corrector, ...dto })
            );
            this.staticCorrectorSyncQueue.add(
                STATIC_CORRECTOR_SYNC_UPDATE,
                { user, entity },
                { delay: 1000 }
            );
            this.staticCorrectorSyncQueue.add(
                STATIC_CORRECTOR_SYNC_UPDATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update static corrector`, e);
        }
    }

    public async deleteOne(user: UserEntity, id: string): Promise<StaticCorrectorEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete static corrector`, e);
        }
        this.staticCorrectorSyncQueue.add(
            STATIC_CORRECTOR_SYNC_DELETE, { user, entity }
        );
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

        this.staticCorrectorSyncQueue.add(
            STATIC_CORRECTOR_SYNC_CREATE_FILE,
            {
                user, entity, file: { buffer: (await entries[entity.pathname].buffer()) }
            },
            { delay: 1000 }
        );
    }

    public async importMetadataFile(
        user: UserEntity, exercise: ExerciseEntity, metadataFile: any
    ): Promise<StaticCorrectorEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: StaticCorrectorEntity = await this.repository.save({
            command_line: metadata.command_line,
            pathname: metadata.pathname,
            exercise_id: exercise.id
        });

        this.staticCorrectorSyncQueue.add(
            STATIC_CORRECTOR_SYNC_CREATE, { user, entity }
        );

        return entity;
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'static_corrector', prop: 'static_correctors' }
            ],
            `static_corrector.id = '${id}'`,
            `permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
