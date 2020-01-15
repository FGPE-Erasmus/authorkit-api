import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { CrudRequest } from '@nestjsx/crud';

import { getParamValueFromCrudRequest } from '../_helpers';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { AppLogger } from '../app.logger';
import { PermissionService } from '../permissions/permission.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { GithubApiService } from '../github-api/github-api.service';
import { ProjectEntity } from './entity/project.entity';

@Injectable()
export class ProjectService extends TypeOrmCrudService<ProjectEntity> {

    private logger = new AppLogger(ProjectService.name);

    constructor(
        @InjectRepository(ProjectEntity) protected readonly repository: Repository<ProjectEntity>,
        protected readonly githubApiService: GithubApiService,
        protected readonly permissionService: PermissionService
    ) {
        super(repository);
    }

    public async findAllOfOwner(user_id: string): Promise<ProjectEntity[]> {
        this.logger.debug(`[findAllOfOwner] Looking in projects for owner ${user_id}`);
        const projects = await this.find({ where: {
            owner_id: { eq: user_id }
        } });
        return projects;
    }

    public async createOne(req: CrudRequest, dto: ProjectEntity): Promise<ProjectEntity> {
        const project = await super.createOne(req, dto);
        try {
            await this.permissionService.addOwnerPermission(project.id, project.owner_id);
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
        return project;
    }

    public async replaceOne(req: CrudRequest, dto: ProjectEntity): Promise<ProjectEntity> {
        const id = getParamValueFromCrudRequest(req, 'id');
        if (!id) {
            throw new BadRequestException('Project id is required.');
        }
        const project = await super.replaceOne(req, dto);
        await this.permissionService.updateOwnerPermission(project.id, project.owner_id);
        return project;
    }

    public async deleteOne(req: CrudRequest): Promise<ProjectEntity | void> {
        const project = await super.deleteOne(req);
        if (project instanceof ProjectEntity) {
            await this.githubApiService.deleteProjectRepository(project);
        }
        return project;
    }

    public async getAccessLevel(project_id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' }
            ],
            `project.id = '${project_id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
