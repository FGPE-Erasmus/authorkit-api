import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { CrudRequest } from '@nestjsx/crud';

import { create, Archiver } from 'archiver';

import { getAccessLevel } from '../_helpers/security/check-access-level';
import { AppLogger } from '../app.logger';
import { PermissionService } from '../permissions/permission.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity/user.entity';
import { ExerciseService } from '../exercises/exercise.service';
import { GamificationLayerService } from '../gamification-layers/gamification-layer.service';

import { ProjectEntity } from './entity/project.entity';

@Injectable()
export class ProjectService extends TypeOrmCrudService<ProjectEntity> {

    private logger = new AppLogger(ProjectService.name);

    constructor(
        @InjectRepository(ProjectEntity) protected readonly repository: Repository<ProjectEntity>,
        protected readonly githubApiService: GithubApiService,
        protected readonly permissionService: PermissionService,
        protected readonly exerciseService: ExerciseService,
        protected readonly gamificationLayerService: GamificationLayerService
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
            throw e;
        }
        return project;
    }

    public async updateOne(req: CrudRequest, dto: ProjectEntity): Promise<ProjectEntity> {
        return await super.updateOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<ProjectEntity | void> {
        return await super.deleteOne(req);
    }

    public async export(
        user: UserEntity, id: string, format: string = 'zip', res: any
    ): Promise<void> {

        const project: ProjectEntity = await this.findOne(id, { loadRelationIds: true });

        const archive: Archiver = create(format);

        archive.pipe(res);

        archive.on('error', function(err) {
            throw err;
        });

        const asyncArchiveWriters = [];

        for (const exercise_id of project['__exercises__']) {
            await this.exerciseService.collectAllToExport(
                user, exercise_id, archive, asyncArchiveWriters, `exercises/${exercise_id}/`
            );
        }

        for (const gamification_layer_id of project['__gamification_layers__']) {
            await this.gamificationLayerService.collectAllToExport(
                user, gamification_layer_id, archive, asyncArchiveWriters, `gamification-layers/${gamification_layer_id}/`
            );
        }

        await Promise.all(asyncArchiveWriters);

        await archive.finalize();
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
