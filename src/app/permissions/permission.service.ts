import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository, In, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { CrudRequest } from '@nestjsx/crud';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { PermissionEntity } from '../permissions/entity/permission.entity';
import { AccessLevel } from '../permissions/entity/access-level.enum';

@Injectable()
export class PermissionService extends TypeOrmCrudService<PermissionEntity> {

    private logger = new AppLogger(PermissionService.name);

    constructor(
        @InjectRepository(PermissionEntity) protected readonly repository: Repository<PermissionEntity>,
        protected readonly githubApiService: GithubApiService
    ) {
        super(repository);
    }

    public async findAllPermissionsOf(user_id: string): Promise<PermissionEntity[]> {
        return super.find({
            where: {
                user_id
            }
        });
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
        return AccessLevel.NONE;
    }

    public async findPermissionOf(user_id: string, project_id: string): Promise<PermissionEntity | null> {
        this.logger.debug(`[findPermissionOf] Looking for permission of user \
            ${user_id} in project ${project_id}`);
        return await this.repository.findOne({
            user_id,
            project_id
        });
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
            `permission.project_id = '${project_id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
