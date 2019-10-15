import { Injectable, Inject, HttpService } from '@nestjs/common';
import { DeepPartial, Repository, In } from 'typeorm';

import { RequestContext } from '../_helpers/request-context';
import { CrudService } from '../../base';
import { AppLogger } from '../app.logger';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/entity';
import { ProjectEntity, ProjectAccessLevel } from './entity';
import { PROJECT_TOKEN, PERMISSION_TOKEN } from './project.constants';
import { PermissionEntity } from './entity/permission.entity';
import { OtherVoterActionEnum } from '../security';

@Injectable()
export class ProjectService extends CrudService<ProjectEntity> {

    private logger = new AppLogger(ProjectService.name);

    constructor(
        @Inject(PROJECT_TOKEN) protected readonly repository: Repository<ProjectEntity>,
        @Inject(PERMISSION_TOKEN) protected readonly permissionRepository: Repository<PermissionEntity>,
        private readonly httpService: HttpService,
        private readonly userService: UserService
    ) {
        super();
    }

    public async create(data: DeepPartial<ProjectEntity>, internal: boolean = false): Promise<ProjectEntity> {
        if (!data.owner_id) {
            data.permissions = [{
                user: RequestContext.currentUser(),
                access_level: ProjectAccessLevel.OWNER
            }];
            data.owner = RequestContext.currentUser();
        }
        return await super.create(data, internal);
    }

    public async findAccessibleProjects(internal: boolean = false): Promise<ProjectEntity[]> {
        const currentUser = RequestContext.currentUser();
        if (internal || currentUser.roles.includes(UserRole.ADMIN)) {
            return super.findAll({}, internal);
        } else {
            return super.findAll({
                relations: ['permissions'],
                where: {
                    user_id: currentUser.id,
                    access_level: In([
                        ProjectAccessLevel.ADMIN,
                        ProjectAccessLevel.OWNER,
                        ProjectAccessLevel.CONTRIBUTOR,
                        ProjectAccessLevel.VIEWER
                    ])
                }
            }, internal);
        }
    }

    public async findAllOfOwner(user_id: string, internal: boolean = false): Promise<ProjectEntity[]> {
        this.logger.debug(`[findAllOfOwner] Looking in projects for owner ${user_id}`);
        const projects = await this.findAll({ where: {
            user_id: { eq: user_id },
            access_level: { eq: ProjectAccessLevel.OWNER }
        } }, internal);
        return projects;
    }

    public async findAccessLevelOfUser(user_id: string, project_id: string,
            internal: boolean = false): Promise<ProjectAccessLevel | null> {
        this.logger.debug(`[findAccessLevelOfUser] Looking for access-level of user \
            ${user_id} in project ${project_id}`);
        const permission = await this.permissionRepository.findOne({
            user_id,
            project_id
        });
        if (permission) {
            return permission.access_level;
        }
        return ProjectAccessLevel.NONE;
    }

    public async share(project_id: string, data: DeepPartial<PermissionEntity>) {
        const project: ProjectEntity = await this.findOneById(project_id, true);
        this.securityService.denyAccessUnlessGranted(
            OtherVoterActionEnum.MANAGE_PERMISSIONS,
            project
        );
        data.project_id = project_id;
        return await this.permissionRepository.save(data);
    }

    public async revoke(project_id: string, user_id: string) {
        const project: ProjectEntity = await this.findOneById(project_id, true);
        this.securityService.denyAccessUnlessGranted(
            OtherVoterActionEnum.MANAGE_PERMISSIONS,
            project
        );
        const permissions = await project.permissions;
        const permission = permissions.find(
            perm => perm.project_id === project_id && perm.user_id === user_id);
        return await this.permissionRepository.remove(permission);
    }
}
