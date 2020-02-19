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
    EMBEDDABLE_CMD_CREATE,
    EMBEDDABLE_CMD_UPDATE,
    EMBEDDABLE_CMD_DELETE
} from './embeddable.constants';
import { EmbeddableEntity } from './entity/embeddable.entity';

@Controller()
export class EmbeddableListener {

    private logger = new AppLogger(EmbeddableListener.name);

    constructor(
        @InjectRepository(EmbeddableEntity)
        protected readonly repository: Repository<EmbeddableEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: EMBEDDABLE_CMD_CREATE })
    public async onEmbeddableCreate(
        { user, embeddable, contents }: { user: UserEntity, embeddable: EmbeddableEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onEmbeddableCreate] Create embeddable in Github repository`);
            const exercise = await this.exerciseService.findOne(embeddable.exercise_id);

            // embeddable
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/embeddables/${embeddable.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: embeddable.id,
                    pathname: embeddable.pathname,
                    type: 'EMBEDDABLE'
                })).toString('base64')
            );
            await this.repository.update(embeddable.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/embeddables/${embeddable.id}/${embeddable.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(embeddable.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onEmbeddableCreate] Embeddable created in Github repository');
        } catch (err) {
            this.logger.error(`[onEmbeddableCreate] Embeddable NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: EMBEDDABLE_CMD_UPDATE })
    public async onEmbeddableUpdate(
        { user, embeddable, contents }: { user: UserEntity, embeddable: EmbeddableEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onEmbeddableUpdate] Update embeddable in Github repository`);
            const exercise = await this.exerciseService.findOne(embeddable.exercise_id);

            // embeddable
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/embeddables/${embeddable.id}/metadata.json`,
                embeddable.sha,
                Buffer.from(JSON.stringify({
                    id: embeddable.id,
                    pathname: embeddable.pathname,
                    type: 'EMBEDDABLE'
                })).toString('base64')
            );
            await this.repository.update(embeddable.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/embeddables/${embeddable.id}/${embeddable.pathname}`,
                embeddable.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(embeddable.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onEmbeddableUpdate] Embeddable updated in Github repository');
        } catch (err) {
            this.logger.error(`[onEmbeddableUpdate] Embeddable NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: EMBEDDABLE_CMD_DELETE })
    public async onEmbeddableDelete(
        { user, embeddable }: { user: UserEntity, embeddable: EmbeddableEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onEmbeddableDelete] Delete embeddable in Github repository`);
            const exercise = await this.exerciseService.findOne(embeddable.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/embeddables/${embeddable.id}`
            );
            this.logger.debug('[onEmbeddableDelete] Embeddable deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onEmbeddableDelete] Embeddable NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
