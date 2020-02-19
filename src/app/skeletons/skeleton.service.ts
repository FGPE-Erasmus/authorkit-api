import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { ExerciseService } from '../exercises/exercise.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity';
import { SkeletonEntity } from './entity/skeleton.entity';
import { SkeletonEmitter } from './skeleton.emitter';


@Injectable()
export class SkeletonService {

    private logger = new AppLogger(SkeletonService.name);

    constructor(
        @InjectRepository(SkeletonEntity)
        protected readonly repository: Repository<SkeletonEntity>,

        protected readonly emitter: SkeletonEmitter,

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
            this.emitter.sendCreate(user, entity, file);
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
            this.emitter.sendUpdate(user, entity, file);
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
        this.emitter.sendDelete(user, entity);
        return entity;
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'skeleton', prop: 'skeletons' }
            ],
            `skeleton.id = '${id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
