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
    STATIC_CORRECTOR_CMD_CREATE,
    STATIC_CORRECTOR_CMD_UPDATE,
    STATIC_CORRECTOR_CMD_DELETE
} from './static-corrector.constants';
import { StaticCorrectorEntity } from './entity/static-corrector.entity';

@Controller()
export class StaticCorrectorListener {

    private logger = new AppLogger(StaticCorrectorListener.name);

    constructor(
        @InjectRepository(StaticCorrectorEntity)
        protected readonly repository: Repository<StaticCorrectorEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: STATIC_CORRECTOR_CMD_CREATE })
    public async onStaticCorrectorCreate(
        { user, static_corrector, contents }: { user: UserEntity, static_corrector: StaticCorrectorEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onStaticCorrectorCreate] Create static corrector in Github repository`);
            const exercise = await this.exerciseService.findOne(static_corrector.exercise_id);

            // static corrector
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/static-correctors/${static_corrector.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: static_corrector.id,
                    pathname: static_corrector.pathname,
                    command_line: static_corrector.command_line
                })).toString('base64')
            );
            await this.repository.update(static_corrector.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/static-correctors/${static_corrector.id}/${static_corrector.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(static_corrector.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onStaticCorrectorCreate] Static corrector created in Github repository');
        } catch (err) {
            this.logger.error(`[onStaticCorrectorCreate] Static corrector NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: STATIC_CORRECTOR_CMD_UPDATE })
    public async onStaticCorrectorUpdate(
        { user, static_corrector, contents }: { user: UserEntity, static_corrector: StaticCorrectorEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onStaticCorrectorUpdate] Update static corrector in Github repository`);
            const exercise = await this.exerciseService.findOne(static_corrector.exercise_id);

            // static corrector
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/static-correctors/${static_corrector.id}/metadata.json`,
                static_corrector.sha,
                Buffer.from(JSON.stringify({
                    id: static_corrector.id,
                    pathname: static_corrector.pathname,
                    command_line: static_corrector.command_line
                })).toString('base64')
            );
            await this.repository.update(static_corrector.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/static-correctors/${static_corrector.id}/${static_corrector.pathname}`,
                static_corrector.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(static_corrector.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onStaticCorrectorUpdate] Static corrector updated in Github repository');
        } catch (err) {
            this.logger.error(`[onStaticCorrectorUpdate] Static corrector NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: STATIC_CORRECTOR_CMD_DELETE })
    public async onStaticCorrectorDelete(
        { user, static_corrector }: { user: UserEntity, static_corrector: StaticCorrectorEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onStaticCorrectorDelete] Delete static corrector in Github repository`);
            const exercise = await this.exerciseService.findOne(static_corrector.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/static-correctors/${static_corrector.id}`
            );
            this.logger.debug('[onStaticCorrectorDelete] Static corrector deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onStaticCorrectorDelete] Static corrector NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
