import { Injectable, Inject, HttpService } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CrudService } from '../../base';
import { AppLogger } from '../app.logger';
import { UserService } from '../user/user.service';
import { PROJECT_USER_TOKEN } from './project-user.constants';
import { ProjectUserEntity } from './entity/project-user.entity';
import { ProjectAccessLevel } from './entity/project-access-level.enum';

@Injectable()
export class ProjectUserService extends CrudService<ProjectUserEntity> {

    private logger = new AppLogger(ProjectUserService.name);

    constructor(
        @Inject(PROJECT_USER_TOKEN) protected readonly repository: Repository<ProjectUserEntity>,
        private readonly httpService: HttpService,
        private readonly userService: UserService
    ) {
        super();
    }

    public async findAllOfProject(projectId: string, internal: boolean = false): Promise<ProjectUserEntity[]> {
        this.logger.debug(`[findAllOfProject] Looking in project-user for project ${projectId}`);
        const users = await this.findAll({ where: { project_id: { eq: projectId } } }, internal);
        return users;
    }

    public async findAllOfOwner(userId: string, internal: boolean = false): Promise<ProjectUserEntity[]> {
        this.logger.debug(`[findAllOfOwner] Looking in project-user for owner ${userId}`);
        const users = await this.findAll({ where: {
            user_id: { eq: userId },
            access_level: { eq: ProjectAccessLevel.OWNER }
        } }, internal);
        return users;
    }

    public async findAccessLevelOfUserInProject(userId: string, projectId: string,
            internal: boolean = false): Promise<ProjectAccessLevel | null> {
        this.logger.debug(`[findAccessLevelOfUserInProject] Looking in project-user for access-level of user \
            ${userId} in project ${projectId}`);
        const permission = await this.findOne({
            where: {
                user_id: { eq: userId },
                project_id: { eq: projectId }
            },
            select: ['access_level']
        }, internal);
        if (permission) {
            return permission.access_level;
        }
        return ProjectAccessLevel.NONE;
    }
}
