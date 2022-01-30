import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';

import { AppLogger } from '../app.logger';
import { GitService } from '../git/git.service';

import {
    PROJECT_SYNC_QUEUE,
    PROJECT_SYNC_CREATE_METADATA,
    PROJECT_SYNC_CREATE_REPO,
    PROJECT_SYNC_UPDATE_METADATA,
    PROJECT_SYNC_UPDATE_REPO,
    PROJECT_SYNC_DELETE_REPO
} from './project.constants';
import { ProjectEntity } from './entity';

@Processor(PROJECT_SYNC_QUEUE)
export class ProjectSyncProcessor {
    private logger = new AppLogger(ProjectSyncProcessor.name);

    constructor(
        @InjectRepository(ProjectEntity)
        protected readonly repository: Repository<ProjectEntity>,
        @InjectQueue(PROJECT_SYNC_QUEUE)
        private readonly projectSyncQueue: Queue,
        protected readonly gitService: GitService
    ) {}

    @Process(PROJECT_SYNC_CREATE_REPO)
    public async onProjectCreateRepository(job: Job) {
        this.logger.debug(
            `[onProjectCreateRepository] Create project repository in Github repository`
        );
        const { user, project } = job.data;
        await this.gitService.createProjectRepository(user, project);
        this.projectSyncQueue.add(PROJECT_SYNC_CREATE_METADATA, {
            user,
            project
        });
        this.logger.debug(
            '[onProjectCreateRepository] Project repository created in Github repository'
        );
    }

    @Process(PROJECT_SYNC_CREATE_METADATA)
    public async onProjectCreateMetadata(job: Job) {
        this.logger.debug(
            `[onProjectCreateMetadata] Create project metadata in Github repository`
        );
        const { user, project } = job.data;
        const res = await this.gitService.createFile(
            user,
            project.id,
            'metadata.json',
            Buffer.from(
                JSON.stringify({
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    status: project.status?.toUpperCase(),
                    is_public: project.is_public
                })
            ).toString('base64')
        );
        await this.repository.update(project.id, { sha: res });
        this.logger.debug(
            '[onProjectCreateMetadata] Project metadata created in Github repository'
        );
    }

    @Process(PROJECT_SYNC_UPDATE_REPO)
    public async onProjectUpdateRepository(job: Job) {
        this.logger.debug(
            `[onProjectUpdateRepository] Update project repository in Github`
        );
        const { user, project } = job.data;
        await this.gitService.updateProjectRepository(user, project);
        this.projectSyncQueue.add(PROJECT_SYNC_UPDATE_METADATA, {
            user,
            project
        });
        this.logger.debug(
            '[onProjectUpdateRepository] Project repository updated in Github'
        );
    }

    @Process(PROJECT_SYNC_UPDATE_METADATA)
    public async onProjectUpdateMetadata(job: Job) {
        this.logger.debug(
            `[onProjectUpdateMetadata] Update project metadata in Github repository`
        );
        const { user, project } = job.data;
        const res = await this.gitService.updateFile(
            user,
            project.id,
            'metadata.json',
            Buffer.from(
                JSON.stringify({
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    status: project.status?.toUpperCase(),
                    is_public: project.is_public
                })
            ).toString('base64')
        );
        await this.repository.update(project.id, { sha: res });
        this.logger.debug(
            '[onProjectUpdateMetadata] Project metadata updated in Github repository'
        );
    }

    @Process(PROJECT_SYNC_DELETE_REPO)
    public async onProjectDeleteRepository(job: Job) {
        this.logger.debug(
            `[onProjectDeleteRepository] Delete project repository in Github`
        );
        const { user, project } = job.data;
        await this.gitService.deleteProjectRepository(project);
        this.logger.debug(
            '[onProjectDeleteRepository] Project repository deleted in Github'
        );
    }
}
