import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DeepPartial, Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { CrudRequest } from '@nestjsx/crud';

import { getParamValueFromCrudRequest } from '../_helpers';
import { RequestContext } from '../_helpers/request-context';
import { AppLogger } from '../app.logger';
import { UserRole } from '../access-control/user-role.enum';
import { UserContextRole } from '../access-control/user-context-role.enum';
import { GithubApiService } from '../github-api/github-api.service';
import { ProjectEntity, ProjectAccessLevel } from './entity';
import { PermissionEntity } from './entity/permission.entity';

@Injectable()
export class ProjectService extends TypeOrmCrudService<ProjectEntity> {

    private logger = new AppLogger(ProjectService.name);

    constructor(
        @InjectRepository(ProjectEntity) protected readonly repository: Repository<ProjectEntity>,
        @InjectRepository(PermissionEntity) protected readonly permissionRepository: Repository<PermissionEntity>,
        protected readonly githubApiService: GithubApiService
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

    public async createOne(req: CrudRequest, dto: ProjectEntity): Promise<ProjectEntity> {
        const project = await super.createOne(req, dto);
        try {
            const repo = await this.githubApiService.createProjectRepository(project);
        } catch (e) {
            await this.repository.remove(project);
            throw e;
        }
        return project;
    }

    public async updateOne(req: CrudRequest, dto: ProjectEntity): Promise<ProjectEntity> {
        const id = getParamValueFromCrudRequest(req, 'id');
        if (!id) {
            throw new BadRequestException('Project id is required.');
        }
        const project = await super.updateOne(req, dto);
        const repo = await this.githubApiService.updateProjectRepository(project);
        return project;
    }

    public async replaceOne(req: CrudRequest, dto: ProjectEntity): Promise<ProjectEntity> {
        const id = getParamValueFromCrudRequest(req, 'id');
        if (!id) {
            throw new BadRequestException('Project id is required.');
        }
        const project = await super.replaceOne(req, dto);
        const repo = await this.githubApiService.updateProjectRepository(project);
        return project;
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

    public async deleteOne(req: CrudRequest): Promise<ProjectEntity | void> {
        const project = await super.deleteOne(req);
        if (project instanceof ProjectEntity) {
            await this.githubApiService.deleteProjectRepository(project);
        }
        return project;
    }
}
