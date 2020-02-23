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
    DYNAMIC_CORRECTOR_SYNC_QUEUE,
    DYNAMIC_CORRECTOR_SYNC_CREATE,
    DYNAMIC_CORRECTOR_SYNC_UPDATE,
    DYNAMIC_CORRECTOR_SYNC_DELETE
} from './dynamic-corrector.constants';
import { DynamicCorrectorEntity } from './entity/dynamic-corrector.entity';


@Injectable()
export class DynamicCorrectorService {

    private logger = new AppLogger(DynamicCorrectorService.name);

    constructor(
        @InjectRepository(DynamicCorrectorEntity)
        protected readonly repository: Repository<DynamicCorrectorEntity>,

        @InjectQueue(DYNAMIC_CORRECTOR_SYNC_QUEUE) private readonly dynamicCorrectorSyncQueue: Queue,

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
                `exercises/${exercise.id}/dynamic-correctors/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${entity.pathname}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<DynamicCorrectorEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get dynamic corrector`, e);
        }
    }

    public async createOne(user: UserEntity, dto: DynamicCorrectorEntity, file: any):
            Promise<DynamicCorrectorEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(plainToClass(DynamicCorrectorEntity, dto));
            this.dynamicCorrectorSyncQueue.add(
                DYNAMIC_CORRECTOR_SYNC_CREATE, { user, entity, file }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create dynamic corrector`, e);
        }
    }

    public async updateOne(user: UserEntity, id: string, dto: DynamicCorrectorEntity, file: any):
            Promise<DynamicCorrectorEntity> {
        const dynamic_corrector = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(DynamicCorrectorEntity, { ...dynamic_corrector, ...dto })
            );
            this.dynamicCorrectorSyncQueue.add(
                DYNAMIC_CORRECTOR_SYNC_UPDATE, { user, entity, file }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update dynamic corrector`, e);
        }
    }

    public async deleteOne(user: UserEntity, id: string): Promise<DynamicCorrectorEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete dynamic corrector`, e);
        }
        this.dynamicCorrectorSyncQueue.add(
            DYNAMIC_CORRECTOR_SYNC_DELETE, { user, entity }
        );
        return entity;
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'dynamic_corrector', prop: 'dynamic_correctors' }
            ],
            `dynamic_corrector.id = '${id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
