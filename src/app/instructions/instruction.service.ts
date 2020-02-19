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
import { InstructionEntity } from './entity/instruction.entity';
import { InstructionEmitter } from './instruction.emitter';


@Injectable()
export class InstructionService {

    private logger = new AppLogger(InstructionService.name);

    constructor(
        @InjectRepository(InstructionEntity)
        protected readonly repository: Repository<InstructionEntity>,

        protected readonly emitter: InstructionEmitter,

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
                `exercises/${exercise.id}/instructions/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${entity.pathname}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<InstructionEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get instruction`, e);
        }
    }

    public async createOne(user: UserEntity, dto: InstructionEntity, file: any):
            Promise<InstructionEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(plainToClass(InstructionEntity, dto));
            this.emitter.sendCreate(user, entity, file);
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create instruction`, e);
        }
    }

    public async updateOne(user: UserEntity, id: string, dto: InstructionEntity, file: any):
            Promise<InstructionEntity> {
        const instruction = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(InstructionEntity, { ...instruction, ...dto })
            );
            this.emitter.sendUpdate(user, entity, file);
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update instruction`, e);
        }
    }

    public async deleteOne(user: UserEntity, id: string): Promise<InstructionEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete instruction`, e);
        }
        this.emitter.sendDelete(user, entity);
        return entity;
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'instruction', prop: 'instructions' }
            ],
            `instruction.id = '${id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
