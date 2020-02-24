import { Injectable, InternalServerErrorException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { ExerciseService } from '../exercises/exercise.service';
import { ExerciseEntity } from '../exercises/entity/exercise.entity';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity';

import {
    FEEDBACK_GENERATOR_SYNC_QUEUE,
    FEEDBACK_GENERATOR_SYNC_CREATE,
    FEEDBACK_GENERATOR_SYNC_UPDATE,
    FEEDBACK_GENERATOR_SYNC_DELETE,
    FEEDBACK_GENERATOR_SYNC_CREATE_FILE,
    FEEDBACK_GENERATOR_SYNC_UPDATE_FILE
} from './feedback-generator.constants';
import { FeedbackGeneratorEntity } from './entity/feedback-generator.entity';


@Injectable()
export class FeedbackGeneratorService {

    private logger = new AppLogger(FeedbackGeneratorService.name);

    constructor(
        @InjectRepository(FeedbackGeneratorEntity)
        protected readonly repository: Repository<FeedbackGeneratorEntity>,

        @InjectQueue(FEEDBACK_GENERATOR_SYNC_QUEUE) private readonly feedbackGeneratorSyncQueue: Queue,

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
                `exercises/${exercise.id}/feedback-generators/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${entity.pathname}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<FeedbackGeneratorEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get feedback generator`, e);
        }
    }

    public async createOne(user: UserEntity, dto: FeedbackGeneratorEntity, file: any):
            Promise<FeedbackGeneratorEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(plainToClass(FeedbackGeneratorEntity, dto));
            this.feedbackGeneratorSyncQueue.add(
                FEEDBACK_GENERATOR_SYNC_CREATE,
                { user, entity }
            );
            this.feedbackGeneratorSyncQueue.add(
                FEEDBACK_GENERATOR_SYNC_CREATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create feedback generator`, e);
        }
    }

    public async updateOne(user: UserEntity, id: string, dto: FeedbackGeneratorEntity, file: any):
            Promise<FeedbackGeneratorEntity> {
        dto.pathname = file.originalname;
        try {
            await this.repository.update(
                id,
                {
                    command_line: dto.command_line,
                    pathname: dto.pathname
                }
            );
            const entity = await this.repository.findOneOrFail(id);
            this.feedbackGeneratorSyncQueue.add(
                FEEDBACK_GENERATOR_SYNC_UPDATE,
                { user, entity }
            );
            this.feedbackGeneratorSyncQueue.add(
                FEEDBACK_GENERATOR_SYNC_UPDATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update feedback generator`, e);
        }
    }

    public async deleteOne(user: UserEntity, id: string): Promise<FeedbackGeneratorEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete feedback generator`, e);
        }
        this.feedbackGeneratorSyncQueue.add(
            FEEDBACK_GENERATOR_SYNC_DELETE,
            { user, entity }
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

        this.feedbackGeneratorSyncQueue.add(
            FEEDBACK_GENERATOR_SYNC_CREATE_FILE,
            {
                user, entity, file: { buffer: (await entries[entity.pathname].buffer()) }
            },
            { delay: 1000 }
        );
    }

    public async importMetadataFile(
        user: UserEntity, exercise: ExerciseEntity, metadataFile: any
    ): Promise<FeedbackGeneratorEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: FeedbackGeneratorEntity = await this.repository.save({
            command_line: metadata.command_line,
            pathname: metadata.pathname,
            exercise_id: exercise.id
        });

        this.feedbackGeneratorSyncQueue.add(
            FEEDBACK_GENERATOR_SYNC_CREATE, { user, entity }
        );

        return entity;
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'feedback_generator', prop: 'feedback_generators' }
            ],
            `feedback_generator.id = '${id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
