import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    FEEDBACK_GENERATOR_SYNC_QUEUE,
    FEEDBACK_GENERATOR_SYNC_CREATE,
    FEEDBACK_GENERATOR_SYNC_UPDATE,
    FEEDBACK_GENERATOR_SYNC_DELETE,
    FEEDBACK_GENERATOR_SYNC_CREATE_FILE,
    FEEDBACK_GENERATOR_SYNC_UPDATE_FILE
} from './feedback-generator.constants';
import { FeedbackGeneratorEntity } from './entity/feedback-generator.entity';

@Processor(FEEDBACK_GENERATOR_SYNC_QUEUE)
export class FeedbackGeneratorSyncProcessor {

    private logger = new AppLogger(FeedbackGeneratorSyncProcessor.name);

    constructor(
        @InjectRepository(FeedbackGeneratorEntity)
        protected readonly repository: Repository<FeedbackGeneratorEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @Process(FEEDBACK_GENERATOR_SYNC_CREATE)
    public async onFeedbackGeneratorCreate(job: Job) {
        this.logger.debug(`[onFeedbackGeneratorCreate] Create feedback generator in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // feedback generator
        const res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/feedback-generators/${entity.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                command_line: entity.command_line
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        this.logger.debug('[onFeedbackGeneratorCreate] Feedback generator created in Github repository');
    }

    @Process(FEEDBACK_GENERATOR_SYNC_CREATE_FILE)
    public async onFeedbackGeneratorCreateFile(job: Job) {
        this.logger.debug(`[onFeedbackGeneratorCreateFile] Create feedback generator in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const file_res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/feedback-generators/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onFeedbackGeneratorCreateFile] Feedback generator created in Github repository');
    }

    @Process(FEEDBACK_GENERATOR_SYNC_UPDATE)
    public async onFeedbackGeneratorUpdate(job: Job) {
        this.logger.debug(`[onFeedbackGeneratorUpdate] Update feedback generator in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // feedback generator
        const res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/feedback-generators/${entity.id}/metadata.json`,
            entity.sha,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                command_line: entity.command_line
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        this.logger.debug('[onFeedbackGeneratorUpdate] Feedback generator updated in Github repository');
    }

    @Process(FEEDBACK_GENERATOR_SYNC_UPDATE_FILE)
    public async onFeedbackGeneratorUpdateFile(job: Job) {
        this.logger.debug(`[onFeedbackGeneratorUpdateFile] Update feedback generator file in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const file_res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/feedback-generators/${entity.id}/${entity.pathname}`,
            entity.file.sha,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onFeedbackGeneratorUpdateFile] Feedback generator file updated in Github repository');
    }

    @Process(FEEDBACK_GENERATOR_SYNC_DELETE)
    public async onFeedbackGeneratorDelete(job: Job) {
        this.logger.debug(`[onFeedbackGeneratorDelete] Delete feedback generator in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.githubApiService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/feedback-generators/${entity.id}`
        );
        this.logger.debug('[onFeedbackGeneratorDelete] Feedback generator deleted in Github repository');
    }
}
