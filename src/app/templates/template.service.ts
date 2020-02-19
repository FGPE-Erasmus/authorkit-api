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
import { TemplateEntity } from './entity/template.entity';
import { TemplateEmitter } from './template.emitter';


@Injectable()
export class TemplateService {

    private logger = new AppLogger(TemplateService.name);

    constructor(
        @InjectRepository(TemplateEntity)
        protected readonly repository: Repository<TemplateEntity>,

        protected readonly emitter: TemplateEmitter,

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
                `exercises/${exercise.id}/templates/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${entity.pathname}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<TemplateEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get template`, e);
        }
    }

    public async createOne(user: UserEntity, dto: TemplateEntity, file: any):
            Promise<TemplateEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(plainToClass(TemplateEntity, dto));
            this.emitter.sendCreate(user, entity, file);
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create template`, e);
        }
    }

    public async updateOne(user: UserEntity, id: string, dto: TemplateEntity, file: any):
            Promise<TemplateEntity> {
        const template = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(TemplateEntity, { ...template, ...dto })
            );
            this.emitter.sendUpdate(user, entity, file);
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update template`, e);
        }
    }

    public async deleteOne(user: UserEntity, id: string): Promise<TemplateEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete template`, e);
        }
        this.emitter.sendDelete(user, entity);
        return entity;
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'template', prop: 'templates' }
            ],
            `template.id = '${id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
