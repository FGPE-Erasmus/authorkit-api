import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { CrudRequest } from '@nestjsx/crud';

import { AppLogger } from '../app.logger';
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

    public async findAccessibleProjects(user_id: string): Promise<PermissionEntity[]> {
        return super.find({
            relations: ['project_id'],
            where: {
                user_id: user_id,
                access_level: In([
                    AccessLevel.ADMIN,
                    AccessLevel.OWNER,
                    AccessLevel.CONTRIBUTOR,
                    AccessLevel.VIEWER
                ])
            }
        });
    }

    public async findAllOfOwner(user_id: string): Promise<PermissionEntity[]> {
        this.logger.debug(`[findAllOfOwner] Looking for permissions of owner ${user_id}`);
        const permissions = await this.find({
            where: {
                owner_id: { eq: user_id }
            }
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
        return AccessLevel.NONE;
    }

    public async addOwnerPermission(project_id: string, user_id: string): Promise<PermissionEntity> {
        const permission = this.repository.create({
            user_id,
            project_id,
            access_level: AccessLevel.OWNER
        });
        return this.repository.save(permission);
    }

    public async revoke(project_id: string, user_id: string) {
        const permission = await this.repository.findOne({
            where: {
                project_id,
                user_id
            }
        });
        if (!permission) {
            throw new BadRequestException('User has no permission to revoke in specified project');
        }
        return await this.repository.remove(permission);
    }

    public async deleteOne(req: CrudRequest): Promise<PermissionEntity | void> {
        const permission = await super.deleteOne(req);
        if (permission instanceof PermissionEntity) {
            // TODO Remove permission from Github repository
            // await this.githubApiService.deleteRepositoryPermission(permission);
        }
        return permission;
    }
}
