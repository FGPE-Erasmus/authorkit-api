import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    STATIC_CORRECTOR_SYNC_QUEUE,
    STATIC_CORRECTOR_SYNC_CREATE,
    STATIC_CORRECTOR_SYNC_UPDATE,
    STATIC_CORRECTOR_SYNC_DELETE
} from './static-corrector.constants';
import { StaticCorrectorEntity } from './entity/static-corrector.entity';

@Processor(STATIC_CORRECTOR_SYNC_QUEUE)
export class StaticCorrectorSyncProcessor {

    private logger = new AppLogger(StaticCorrectorSyncProcessor.name);

    constructor(
        @InjectRepository(StaticCorrectorEntity)
        protected readonly repository: Repository<StaticCorrectorEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @Process(STATIC_CORRECTOR_SYNC_CREATE)
    public async onStaticCorrectorCreate(job: Job) {
        this.logger.debug(`[onStaticCorrectorCreate] Create static corrector in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // static corrector
        const res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/static-correctors/${entity.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                command_line: entity.command_line
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        // file
        const file_res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/static-correctors/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onStaticCorrectorCreate] Static corrector created in Github repository');
    }

    @Process(STATIC_CORRECTOR_SYNC_UPDATE)
    public async onStaticCorrectorUpdate(job: Job) {
        this.logger.debug(`[onStaticCorrectorUpdate] Update static corrector in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // static corrector
        const res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/static-correctors/${entity.id}/metadata.json`,
            entity.sha,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                command_line: entity.command_line
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        // file
        const file_res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/static-correctors/${entity.id}/${entity.pathname}`,
            entity.file.sha,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onStaticCorrectorUpdate] Static corrector updated in Github repository');
    }

    @Process(STATIC_CORRECTOR_SYNC_DELETE)
    public async onStaticCorrectorDelete(job: Job) {
        this.logger.debug(`[onStaticCorrectorDelete] Delete static corrector in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.githubApiService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/static-correctors/${entity.id}`
        );

        this.logger.debug('[onStaticCorrectorDelete] Static corrector deleted in Github repository');
    }
}
