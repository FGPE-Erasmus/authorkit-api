import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    SOLUTION_SYNC_QUEUE,
    SOLUTION_SYNC_CREATE,
    SOLUTION_SYNC_UPDATE,
    SOLUTION_SYNC_DELETE,
    SOLUTION_SYNC_CREATE_FILE,
    SOLUTION_SYNC_UPDATE_FILE
} from './solution.constants';
import { SolutionEntity } from './entity/solution.entity';

@Processor(SOLUTION_SYNC_QUEUE)
export class SolutionSyncProcessor {

    private logger = new AppLogger(SolutionSyncProcessor.name);

    constructor(
        @InjectRepository(SolutionEntity)
        protected readonly repository: Repository<SolutionEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @Process(SOLUTION_SYNC_CREATE)
    public async onSolutionCreate(job: Job) {
        // this.logger.debug(`[onSolutionCreate] Create solution in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // solution
        const res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/solutions/${entity.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                lang: entity.lang
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        // this.logger.debug('[onSolutionCreate] Solution created in Github repository');
    }

    @Process(SOLUTION_SYNC_CREATE_FILE)
    public async onSolutionCreateFile(job: Job) {
        // this.logger.debug(`[onSolutionCreateFile] Create solution file in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const file_res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/solutions/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        // this.logger.debug('[onSolutionCreateFile] Solution file created in Github repository');
    }

    @Process(SOLUTION_SYNC_UPDATE)
    public async onSolutionUpdate(job: Job) {
        // this.logger.debug(`[onSolutionUpdate] Update solution in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // solution
        const res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/solutions/${entity.id}/metadata.json`,
            entity.sha,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                lang: entity.lang
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        this.logger.debug('[onSolutionUpdate] Solution updated in Github repository');
    }

    @Process(SOLUTION_SYNC_UPDATE_FILE)
    public async onSolutionUpdateFile(job: Job) {
        this.logger.debug(`[onSolutionUpdateFile] Update solution file in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const file_res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/solutions/${entity.id}/${entity.pathname}`,
            entity.file.sha,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onSolutionUpdateFile] Solution file updated in Github repository');
    }

    @Process(SOLUTION_SYNC_DELETE)
    public async onSolutionDelete(job: Job) {
        this.logger.debug(`[onSolutionDelete] Delete solution in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.githubApiService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/solutions/${entity.id}`
        );
        this.logger.debug('[onSolutionDelete] Solution deleted in Github repository');
    }
}
