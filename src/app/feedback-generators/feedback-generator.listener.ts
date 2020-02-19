import { Controller } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    FEEDBACK_GENERATOR_CMD_CREATE,
    FEEDBACK_GENERATOR_CMD_UPDATE,
    FEEDBACK_GENERATOR_CMD_DELETE
} from './feedback-generator.constants';
import { FeedbackGeneratorEntity } from './entity/feedback-generator.entity';

@Controller()
export class FeedbackGeneratorListener {

    private logger = new AppLogger(FeedbackGeneratorListener.name);

    constructor(
        @InjectRepository(FeedbackGeneratorEntity)
        protected readonly repository: Repository<FeedbackGeneratorEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: FEEDBACK_GENERATOR_CMD_CREATE })
    public async onFeedbackGeneratorCreate(
        { user, feedback_generator, contents }: { user: UserEntity, feedback_generator: FeedbackGeneratorEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onFeedbackGeneratorCreate] Create feedback generator in Github repository`);
            const exercise = await this.exerciseService.findOne(feedback_generator.exercise_id);

            // feedback generator
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/feedback-generators/${feedback_generator.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: feedback_generator.id,
                    pathname: feedback_generator.pathname,
                    command_line: feedback_generator.command_line
                })).toString('base64')
            );
            await this.repository.update(feedback_generator.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/feedback-generators/${feedback_generator.id}/${feedback_generator.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(feedback_generator.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onFeedbackGeneratorCreate] Feedback generator created in Github repository');
        } catch (err) {
            this.logger.error(`[onFeedbackGeneratorCreate] Feedback generator NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: FEEDBACK_GENERATOR_CMD_UPDATE })
    public async onFeedbackGeneratorUpdate(
        { user, feedback_generator, contents }: { user: UserEntity, feedback_generator: FeedbackGeneratorEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onFeedbackGeneratorUpdate] Update feedback generator in Github repository`);
            const exercise = await this.exerciseService.findOne(feedback_generator.exercise_id);

            // feedback generator
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/feedback-generators/${feedback_generator.id}/metadata.json`,
                feedback_generator.sha,
                Buffer.from(JSON.stringify({
                    id: feedback_generator.id,
                    pathname: feedback_generator.pathname,
                    command_line: feedback_generator.command_line
                })).toString('base64')
            );
            await this.repository.update(feedback_generator.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/feedback-generators/${feedback_generator.id}/${feedback_generator.pathname}`,
                feedback_generator.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(feedback_generator.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onFeedbackGeneratorUpdate] Feedback generator updated in Github repository');
        } catch (err) {
            this.logger.error(`[onFeedbackGeneratorUpdate] Feedback generator NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: FEEDBACK_GENERATOR_CMD_DELETE })
    public async onFeedbackGeneratorDelete(
        { user, feedback_generator }: { user: UserEntity, feedback_generator: FeedbackGeneratorEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onFeedbackGeneratorDelete] Delete feedback generator in Github repository`);
            const exercise = await this.exerciseService.findOne(feedback_generator.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/feedback_generators/${feedback_generator.id}`
            );
            this.logger.debug('[onFeedbackGeneratorDelete] Feedback generator deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onFeedbackGeneratorDelete] Feedback generator NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
