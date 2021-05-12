import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MessagePattern } from '@nestjs/microservices';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    EMBEDDABLE_SYNC_QUEUE,
    EMBEDDABLE_SYNC_CREATE,
    EMBEDDABLE_SYNC_UPDATE,
    EMBEDDABLE_SYNC_DELETE,
    EMBEDDABLE_SYNC_CREATE_FILE,
    EMBEDDABLE_SYNC_UPDATE_FILE
} from './embeddable.constants';
import { EmbeddableEntity } from './entity/embeddable.entity';

@Processor(EMBEDDABLE_SYNC_QUEUE)
export class EmbeddableSyncProcessor {

    private logger = new AppLogger(EmbeddableSyncProcessor.name);

    constructor(
        @InjectRepository(EmbeddableEntity)
        protected readonly repository: Repository<EmbeddableEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @Process(EMBEDDABLE_SYNC_CREATE)
    public async onEmbeddableCreate(job: Job) {
        this.logger.debug(`[onEmbeddableCreate] Create embeddable in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // embeddable
        const res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/embeddables/${entity.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                type: 'EMBEDDABLE'
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        this.logger.debug('[onEmbeddableCreate] Embeddable created in Github repository');
    }

    @Process(EMBEDDABLE_SYNC_CREATE_FILE)
    public async onEmbeddableCreateFile(job: Job) {
        this.logger.debug(`[onEmbeddableCreateFile] Create embeddable file in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const file_res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/embeddables/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onEmbeddableCreateFile] Embeddable file created in Github repository');
    }

    @Process(EMBEDDABLE_SYNC_UPDATE)
    public async onEmbeddableUpdate(job: Job) {
        this.logger.debug(`[onEmbeddableUpdate] Update embeddable in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // embeddable
        const res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/embeddables/${entity.id}/metadata.json`,
            entity.sha,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                type: 'EMBEDDABLE'
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        this.logger.debug('[onEmbeddableUpdate] Embeddable updated in Github repository');
    }

    @Process(EMBEDDABLE_SYNC_UPDATE_FILE)
    public async onEmbeddableUpdateFile(job: Job) {
        this.logger.debug(`[onEmbeddableUpdateFile] Update embeddable file in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const file_res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/embeddables/${entity.id}/${entity.pathname}`,
            entity.file.sha,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onEmbeddableUpdateFile] Embeddable file updated in Github repository');
    }

    @Process(EMBEDDABLE_SYNC_DELETE)
    public async onEmbeddableDelete(job: Job) {
        this.logger.debug(`[onEmbeddableDelete] Delete embeddable in Github repository`);
        const { user, entity } = job.data;
        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.githubApiService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/embeddables/${entity.id}`
        );
        this.logger.debug('[onEmbeddableDelete] Embeddable deleted in Github repository');
    }
}
