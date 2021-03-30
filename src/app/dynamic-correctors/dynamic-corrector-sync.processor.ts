import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    DYNAMIC_CORRECTOR_SYNC_QUEUE,
    DYNAMIC_CORRECTOR_SYNC_CREATE,
    DYNAMIC_CORRECTOR_SYNC_CREATE_FILE,
    DYNAMIC_CORRECTOR_SYNC_UPDATE,
    DYNAMIC_CORRECTOR_SYNC_UPDATE_FILE,
    DYNAMIC_CORRECTOR_SYNC_DELETE
} from './dynamic-corrector.constants';
import { DynamicCorrectorEntity } from './entity/dynamic-corrector.entity';

@Processor(DYNAMIC_CORRECTOR_SYNC_QUEUE)
export class DynamicCorrectorSyncProcessor {

    private logger = new AppLogger(DynamicCorrectorSyncProcessor.name);

    constructor(
        @InjectRepository(DynamicCorrectorEntity)
        protected readonly repository: Repository<DynamicCorrectorEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @Process(DYNAMIC_CORRECTOR_SYNC_CREATE)
    public async onDynamicCorrectorCreate(job: Job) {
        // this.logger.debug(`[onDynamicCorrectorCreate] Create dynamic corrector in Github repository`);

        const { user, entity } = job.data;
        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // dynamic corrector
        const res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/dynamic-correctors/${entity.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                command_line: entity.command_line
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        // this.logger.debug('[onDynamicCorrectorCreate] Dynamic corrector created in Github repository');
    }

    @Process(DYNAMIC_CORRECTOR_SYNC_CREATE_FILE)
    public async onDynamicCorrectorCreateFile(job: Job) {
        // this.logger.debug(`[onDynamicCorrectorCreateFile] Create dynamic corrector in Github repository`);

        const { user, entity, file } = job.data;
        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const file_res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/dynamic-correctors/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        // this.logger.debug('[onDynamicCorrectorCreateFile] Dynamic corrector created in Github repository');
    }

    @Process(DYNAMIC_CORRECTOR_SYNC_UPDATE)
    public async onDynamicCorrectorUpdate(job: Job) {
        // this.logger.debug(`[onDynamicCorrectorUpdate] Update dynamic corrector in Github repository`);

        const { user, entity } = job.data;
        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // dynamic corrector
        const res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/dynamic-correctors/${entity.id}/metadata.json`,
            entity.sha,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                command_line: entity.command_line
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        this.logger.debug('[onDynamicCorrectorUpdate] Dynamic corrector updated in Github repository');
    }

    @Process(DYNAMIC_CORRECTOR_SYNC_UPDATE_FILE)
    public async onDynamicCorrectorUpdateFile(job: Job) {
        this.logger.debug(`[onDynamicCorrectorUpdateFile] Update dynamic corrector in Github repository`);

        const { user, entity, file } = job.data;
        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const file_res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/dynamic-correctors/${entity.id}/${entity.pathname}`,
            entity.file.sha,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onDynamicCorrectorUpdateFile] Dynamic corrector updated in Github repository');
    }

    @Process(DYNAMIC_CORRECTOR_SYNC_DELETE)
    public async onDynamicCorrectorDelete(job: Job) {
        this.logger.debug(`[onDynamicCorrectorDelete] Delete dynamic corrector in Github repository`);
        const { user, entity } = job.data;
        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.githubApiService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/dynamic-correctors/${entity.id}`
        );
        this.logger.debug('[onDynamicCorrectorDelete] Dynamic corrector deleted in Github repository');
    }
}
