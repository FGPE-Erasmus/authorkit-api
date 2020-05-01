import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Repository, Not, In, DeepPartial, FindManyOptions } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { PermissionEntity } from '../permissions/entity/permission.entity';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { ProjectService } from '../project/project.service';

@Injectable()
export class PermissionService extends TypeOrmCrudService<PermissionEntity> {

    private logger = new AppLogger(PermissionService.name);

    constructor(
        @InjectRepository(PermissionEntity) protected readonly repository: Repository<PermissionEntity>,
        @Inject(forwardRef(() => ProjectService))
        protected readonly projectService: ProjectService,
        protected readonly githubApiService: GithubApiService
    ) {
        super(repository);
    }

    public async findAllPermissionsOf(user_id: string): Promise<DeepPartial<PermissionEntity>[]> {
        const permissions: DeepPartial<PermissionEntity>[] = await super.find({
            where: {
                user_id
            }
        });
        const projectIds: string[] = permissions.map(permission => permission.project_id);
        const options: FindManyOptions = {
            select: ['id']
        };
        if (projectIds.length > 0) {
            options.where = {
                id: Not(In(projectIds))
            };
        }
        (await this.projectService.getPublicProjects(options)).forEach(project => {
            permissions.push({ project_id: project.id, user_id, access_level: AccessLevel.VIEWER });
        });
        return permissions;
    }

    public async findAccessLevel(user_id: string, project_id: string): Promise<AccessLevel | null> {
        this.logger.debug(`[findAccessLevel] Looking for access-level of user \
            ${user_id} in project ${project_id}`);
        const permission = await this.repository.findOne({
            user_id,
            project_id
        });
        if (permission) {
            return permission.access_level;
        }
        if ((await this.projectService.isPublicProject(project_id))) {
            return AccessLevel.VIEWER;
        }
        return AccessLevel.NONE;
    }

    public async findPermissionOf(user_id: string, project_id: string): Promise<DeepPartial<PermissionEntity> | null> {
        this.logger.debug(`[findPermissionOf] Looking for permission of user \
            ${user_id} in project ${project_id}`);
        const permission = await this.repository.findOne({
            user_id,
            project_id
        });
        if (!permission) {
            if ((await this.projectService.isPublicProject(project_id))) {
                return {
                    project_id,
                    user_id,
                    access_level: AccessLevel.VIEWER
                };
            }
        }
        return permission;
    }

    public async addOwnerPermission(project_id: string, user_id: string): Promise<PermissionEntity> {
        const permission = this.repository.create({
            user_id,
            project_id,
            access_level: AccessLevel.OWNER
        });
        return this.repository.save(permission);
    }

    public async share(project_id: string, user_id: string, access_level: AccessLevel): Promise<PermissionEntity> {
        const permission: PermissionEntity = await this.repository.findOne({
            where: {
                project_id,
                user_id
            }
        });
        if (permission) {
            this.logger.debug(`[share] Permission found ${permission}`);
            permission.access_level = access_level;
            this.repository.update({
                project_id,
                user_id
            }, { access_level });
            return permission;
        } else {
            this.logger.debug(`[share] Permission not found`);
            return this.repository.save({
                project_id,
                user_id,
                access_level
            });
        }
    }

    public async revoke(project_id: string, user_id: string) {
        const permission = await this.repository.findOne({
            where: {
                project_id,
                user_id
            }
        });
        if (!permission) {
            throw new BadRequestException('No permission found');
        }
        return await this.repository.remove(permission);
    }

    public async getAccessLevel(project_id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [],
            `project.id = '${project_id}'`,
            `permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
