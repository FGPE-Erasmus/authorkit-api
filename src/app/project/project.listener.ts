import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';

import { PROJECT_CMD_CREATE, PROJECT_CMD_UPDATE, PROJECT_CMD_DELETE } from './project.constants';
import { ProjectEntity } from './entity/project.entity';

@Controller()
export class ProjectListener {

    private logger = new AppLogger(ProjectListener.name);

    constructor(
        protected readonly githubApiService: GithubApiService
    ) { }

    @MessagePattern({ cmd: PROJECT_CMD_CREATE })
    public async onProjectCreate(project: ProjectEntity): Promise<void> {
        try {
            this.logger.debug(`[onProjectCreate] Create project in Github repository`);
            await this.githubApiService.createProjectRepository(project);
            this.logger.debug('[onProjectCreate] Project created in Github repository');
        } catch (err) {
            this.logger.error(`[onProjectCreate] Project NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: PROJECT_CMD_UPDATE })
    public async onProjectUpdate(project: ProjectEntity): Promise<void> {
        try {
            this.logger.debug(`[onProjectUpdate] Update project in Github repository`);
            await this.githubApiService.updateProjectRepository(project);
            this.logger.debug('[onProjectUpdate] Project updated in Github repository');
        } catch (err) {
            this.logger.error(`[onProjectUpdate] Project NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: PROJECT_CMD_DELETE })
    public async onProjectDelete(project: ProjectEntity): Promise<void> {
        try {
            this.logger.debug(`[onProjectDelete] Delete project in Github repository`);
            await this.githubApiService.deleteProjectRepository(project);
            this.logger.debug('[onProjectDelete] Project deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onProjectDelete] Project NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}
