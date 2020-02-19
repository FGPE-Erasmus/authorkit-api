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
    DYNAMIC_CORRECTOR_CMD_CREATE,
    DYNAMIC_CORRECTOR_CMD_UPDATE,
    DYNAMIC_CORRECTOR_CMD_DELETE
} from './dynamic-corrector.constants';
import { DynamicCorrectorEntity } from './entity/dynamic-corrector.entity';

@Controller()
export class DynamicCorrectorListener {

    private logger = new AppLogger(DynamicCorrectorListener.name);

    constructor(
        @InjectRepository(DynamicCorrectorEntity)
        protected readonly repository: Repository<DynamicCorrectorEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: DYNAMIC_CORRECTOR_CMD_CREATE })
    public async onDynamicCorrectorCreate(
        { user, dynamic_corrector, contents }: { user: UserEntity, dynamic_corrector: DynamicCorrectorEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onDynamicCorrectorCreate] Create dynamic corrector in Github repository`);
            const exercise = await this.exerciseService.findOne(dynamic_corrector.exercise_id);

            // dynamic corrector
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/dynamic-correctors/${dynamic_corrector.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: dynamic_corrector.id,
                    pathname: dynamic_corrector.pathname,
                    command_line: dynamic_corrector.command_line
                })).toString('base64')
            );
            await this.repository.update(dynamic_corrector.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/dynamic-correctors/${dynamic_corrector.id}/${dynamic_corrector.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(dynamic_corrector.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onDynamicCorrectorCreate] Dynamic corrector created in Github repository');
        } catch (err) {
            this.logger.error(`[onDynamicCorrectorCreate] Dynamic corrector NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: DYNAMIC_CORRECTOR_CMD_UPDATE })
    public async onDynamicCorrectorUpdate(
        { user, dynamic_corrector, contents }: { user: UserEntity, dynamic_corrector: DynamicCorrectorEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onDynamicCorrectorUpdate] Update dynamic corrector in Github repository`);
            const exercise = await this.exerciseService.findOne(dynamic_corrector.exercise_id);

            // dynamic corrector
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/dynamic-correctors/${dynamic_corrector.id}/metadata.json`,
                dynamic_corrector.sha,
                Buffer.from(JSON.stringify({
                    id: dynamic_corrector.id,
                    pathname: dynamic_corrector.pathname,
                    command_line: dynamic_corrector.command_line
                })).toString('base64')
            );
            await this.repository.update(dynamic_corrector.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/dynamic-correctors/${dynamic_corrector.id}/${dynamic_corrector.pathname}`,
                dynamic_corrector.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(dynamic_corrector.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onDynamicCorrectorUpdate] Dynamic corrector updated in Github repository');
        } catch (err) {
            this.logger.error(`[onDynamicCorrectorUpdate] Dynamic corrector NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: DYNAMIC_CORRECTOR_CMD_DELETE })
    public async onDynamicCorrectorDelete(
        { user, dynamic_corrector }: { user: UserEntity, dynamic_corrector: DynamicCorrectorEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onDynamicCorrectorDelete] Delete dynamic corrector in Github repository`);
            const exercise = await this.exerciseService.findOne(dynamic_corrector.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/dynamic-correctors/${dynamic_corrector.id}`
            );
            this.logger.debug('[onDynamicCorrectorDelete] Dynamic corrector deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onDynamicCorrectorDelete] Dynamic corrector NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
