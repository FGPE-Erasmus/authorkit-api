import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    TEMPLATE_SYNC_QUEUE,
    TEMPLATE_SYNC_CREATE,
    TEMPLATE_SYNC_UPDATE,
    TEMPLATE_SYNC_DELETE
} from './template.constants';
import { TemplateEntity } from './entity/template.entity';

@Processor(TEMPLATE_SYNC_QUEUE)
export class TemplateSyncProcessor {

    private logger = new AppLogger(TemplateSyncProcessor.name);

    constructor(
        @InjectRepository(TemplateEntity)
        protected readonly repository: Repository<TemplateEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @Process(TEMPLATE_SYNC_CREATE)
    public async onTemplateCreate(job: Job) {
        this.logger.debug(`[onTemplateCreate] Create template in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // template
        const res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/templates/${entity.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                lang: entity.lang
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        // file
        const file_res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/templates/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onTemplateCreate] Template created in Github repository');
    }

    @Process(TEMPLATE_SYNC_UPDATE)
    public async onTemplateUpdate(job: Job) {
        this.logger.debug(`[onTemplateUpdate] Update template in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // template
        const res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/templates/${entity.id}/metadata.json`,
            entity.sha,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                lang: entity.lang
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        // file
        const file_res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/templates/${entity.id}/${entity.pathname}`,
            entity.file.sha,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onTemplateUpdate] Template updated in Github repository');
    }

    @Process(TEMPLATE_SYNC_DELETE)
    public async onTemplateDelete(job: Job) {
        this.logger.debug(`[onTemplateDelete] Delete template in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.githubApiService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/templates/${entity.id}`
        );

        this.logger.debug('[onTemplateDelete] Template deleted in Github repository');
    }
}
