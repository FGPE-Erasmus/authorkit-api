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
    TEMPLATE_CMD_CREATE,
    TEMPLATE_CMD_UPDATE,
    TEMPLATE_CMD_DELETE
} from './template.constants';
import { TemplateEntity } from './entity/template.entity';

@Controller()
export class TemplateListener {

    private logger = new AppLogger(TemplateListener.name);

    constructor(
        @InjectRepository(TemplateEntity)
        protected readonly repository: Repository<TemplateEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: TEMPLATE_CMD_CREATE })
    public async onTemplateCreate(
        { user, template, contents }: { user: UserEntity, template: TemplateEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTemplateCreate] Create template in Github repository`);
            const exercise = await this.exerciseService.findOne(template.exercise_id);

            // template
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/templates/${template.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: template.id,
                    pathname: template.pathname,
                    lang: template.lang
                })).toString('base64')
            );
            await this.repository.update(template.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/templates/${template.id}/${template.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(template.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onTemplateCreate] Template created in Github repository');
        } catch (err) {
            this.logger.error(`[onTemplateCreate] Template NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TEMPLATE_CMD_UPDATE })
    public async onTemplateUpdate(
        { user, template, contents }: { user: UserEntity, template: TemplateEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTemplateUpdate] Update template in Github repository`);
            const exercise = await this.exerciseService.findOne(template.exercise_id);

            // template
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/templates/${template.id}/metadata.json`,
                template.sha,
                Buffer.from(JSON.stringify({
                    id: template.id,
                    pathname: template.pathname,
                    lang: template.lang
                })).toString('base64')
            );
            await this.repository.update(template.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/templates/${template.id}/${template.pathname}`,
                template.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(template.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onTemplateUpdate] Template updated in Github repository');
        } catch (err) {
            this.logger.error(`[onTemplateUpdate] Template NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TEMPLATE_CMD_DELETE })
    public async onTemplateDelete(
        { user, template }: { user: UserEntity, template: TemplateEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTemplateDelete] Delete template in Github repository`);
            const exercise = await this.exerciseService.findOne(template.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/templates/${template.id}`
            );
            this.logger.debug('[onTemplateDelete] Template deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onTemplateDelete] Template NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
