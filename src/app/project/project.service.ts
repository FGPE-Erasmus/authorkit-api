import { Injectable, BadRequestException } from '@nestjs/common';
import { DeepPartial, Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { RequestContext } from '../_helpers/request-context';
import { AppLogger } from '../app.logger';
import { ProjectEntity, ProjectAccessLevel } from './entity';
import { PermissionEntity } from './entity/permission.entity';
import { UserContextRole } from '../access-control/user-context-role.enum';
import { UserRole } from '../access-control';

@Injectable()
export class ProjectService extends TypeOrmCrudService<ProjectEntity> {

    private logger = new AppLogger(ProjectService.name);

    constructor(
        @InjectRepository(ProjectEntity) protected readonly repository: Repository<ProjectEntity>,
        @InjectRepository(PermissionEntity) protected readonly permissionRepository: Repository<PermissionEntity>
    ) {
        super(repository);
    }

    public async findAccessibleProjects(internal: boolean = false): Promise<ProjectEntity[]> {
        const currentUser = RequestContext.currentUser();
        if (internal || currentUser.roles.includes(UserRole.ADMIN)) {
            return super.find({});
        } else {
            return super.find({
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
            });
        }
    }

    public async findAllOfOwner(user_id: string): Promise<ProjectEntity[]> {
        this.logger.debug(`[findAllOfOwner] Looking in projects for owner ${user_id}`);
        const projects = await this.find({ where: {
            owner_id: { eq: user_id }
        } });
        return projects;
    }

    public async findAccessLevelOfUser(user_id: string, project_id: string,
            internal: boolean = false): Promise<UserContextRole | null> {
        this.logger.debug(`[findAccessLevelOfUser] Looking for access-level of user \
            ${user_id} in project ${project_id}`);
        const permission = await this.permissionRepository.findOne({
            user_id,
            project_id
        });
        if (permission) {
            return permission.role;
        }
        return null;
    }

    public async share(project_id: string, data: DeepPartial<PermissionEntity>) {
        data.project_id = project_id;
        return await this.permissionRepository.save(data);
    }

    public async revoke(project_id: string, user_id: string) {
        const permission = await this.permissionRepository.findOne({
            where: {
                project_id,
                user_id
            }
        });
        if (!permission) {
            throw new BadRequestException('User has no permission to revoke in specified project');
        }
        return await this.permissionRepository.remove(permission);
    }
}
