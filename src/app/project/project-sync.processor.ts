import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';

import {
    PROJECT_SYNC_QUEUE,
    PROJECT_SYNC_CREATE,
    PROJECT_SYNC_UPDATE,
    PROJECT_SYNC_DELETE
} from './project.constants';

@Processor(PROJECT_SYNC_QUEUE)
export class ProjectSyncProcessor {

    private logger = new AppLogger(ProjectSyncProcessor.name);

    constructor(
        protected readonly githubApiService: GithubApiService
    ) { }

    @Process(PROJECT_SYNC_CREATE)
    public async onProjectCreate(job: Job) {
        this.logger.debug(`[onProjectCreate] Create project in Github repository`);
        const { project } = job.data;
        await this.githubApiService.createProjectRepository(project);
        this.logger.debug('[onProjectCreate] Project created in Github repository');
    }

    @Process(PROJECT_SYNC_UPDATE)
    public async onProjectUpdate(job: Job) {
        this.logger.debug(`[onProjectUpdate] Update project in Github repository`);
        const { project } = job.data;
        await this.githubApiService.updateProjectRepository(project);
        this.logger.debug('[onProjectUpdate] Project updated in Github repository');
    }

    @Process(PROJECT_SYNC_DELETE)
    public async onProjectDelete(job: Job) {
        this.logger.debug(`[onProjectDelete] Delete project in Github repository`);
        const { project } = job.data;
        await this.githubApiService.deleteProjectRepository(project);
        this.logger.debug('[onProjectDelete] Project deleted in Github repository');
    }
}
