import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { Open } from 'unzipper';
import { create, Archiver } from 'archiver';

import { DeepPartial } from '../_helpers/database/deep-partial';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { AppLogger } from '../app.logger';
import { PermissionService } from '../permissions/permission.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity/user.entity';
import { ExerciseEntity } from '../exercises/entity/exercise.entity';
import { ExerciseService } from '../exercises/exercise.service';
import { GamificationLayerService } from '../gamification-layers/gamification-layer.service';
import { PermissionEntity } from '../permissions/entity/permission.entity';

import { ProjectEntity } from './entity/project.entity';
import { PROJECT_SYNC_QUEUE, PROJECT_SYNC_CREATE_REPO } from './project.constants';
import { GamificationLayerEntity } from '../gamification-layers/entity/gamification-layer.entity';

@Injectable()
export class ProjectService extends TypeOrmCrudService<ProjectEntity> {

    private logger = new AppLogger(ProjectService.name);

    constructor(
        @InjectRepository(ProjectEntity) protected readonly repository: Repository<ProjectEntity>,
        @InjectQueue(PROJECT_SYNC_QUEUE) private readonly projectSyncQueue: Queue,

        protected readonly githubApiService: GithubApiService,
        @Inject(forwardRef(() => PermissionService))
        protected readonly permissionService: PermissionService,
        protected readonly exerciseService: ExerciseService,
        protected readonly gamificationLayerService: GamificationLayerService
    ) {
        super(repository);
    }

    public async createOne(req: CrudRequest, dto: DeepPartial<ProjectEntity>): Promise<ProjectEntity> {
        const project = await super.createOne(req, dto);
        try {
            await this.permissionService.addOwnerPermission(project.id, project.owner_id);
        } catch (e) {
            throw e;
        }
        return project;
    }

    public async updateOne(req: CrudRequest, dto: DeepPartial<ProjectEntity>): Promise<ProjectEntity> {
        const { allowParamsOverride, returnShallow } = req.options.routes.updateOneBase;
        const paramsFilters = this.getParamFilters(req.parsed);
        const found = await this.getOneOrFail(req, returnShallow);
        const toSave = !allowParamsOverride
          ? { ...dto, ...paramsFilters, ...req.parsed.authPersist }
          : { ...dto, ...req.parsed.authPersist };
        const updated = await this.repo.update(found.id, toSave);

        req.parsed.paramsFilter.forEach((filter) => {
        filter.value = updated[filter.field];
        });
        return this.getOneOrFail(req);
    }

    public async getManyAndCountContributorsAndExercises(req: CrudRequest) {
        const found = await super.getMany(req);
        if (Array.isArray(found)) {
            return await Promise.all(found.map(async p => ({
                ...p,
                countContributors: await this.countContributors(p.id),
                countExercises: await this.countExercises(p.id),
                countGamificationLayers: await this.countGamificationLayers(p.id)
            })));
        } else {
            return {
                ...found,
                data: await Promise.all(found.data.map(async p => ({
                    ...p,
                    countContributors: await this.countContributors(p.id),
                    countExercises: await this.countExercises(p.id),
                    countGamificationLayers: await this.countGamificationLayers(p.id)
                })))
            };
        }
    }

    public async getPublicProjects(options: FindManyOptions<ProjectEntity>) {
        if (options.where) {
            if (typeof options.where === 'string') {
                options.where = options.where + ' AND is_public = true';
            } else if (Array.isArray(options.where)) {
                options.where.push({ is_public: true });
            } else if (typeof options.where === 'object') {
                options.where = {
                    ...options.where,
                    is_public: true
                };
            } else {
                options.where = { is_public: true };
            }
        } else {
            options.where = { is_public: true };
        }
        return await this.repository.find(options);
    }

    public async isPublicProject(id: string) {
        return (await this.repository.findOneOrFail(id)).is_public;
    }

    public async deleteOne(req: CrudRequest): Promise<ProjectEntity | void> {
        return await super.deleteOne(req);
    }

    public async import(
        user: UserEntity, input: any
    ): Promise<void> {

        const directory = await Open.buffer(input.buffer);

        return await this.importProcessEntries(
            user,
            directory.files.reduce(
                (obj, item) => Object.assign(obj, { [item.path]: item }), {}
            )
        );
    }

    public async importProcessEntries(
        user: UserEntity, entries: any
    ) {

        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            this.throwBadRequestException('Archive misses required metadata');
        }

        const project = await this.importMetadataFile(user, root_metadata);

        const result = Object.keys(entries).reduce(function(acc, curr) {
            const match = curr.match('^([a-zA-Z-]+)/([0-9a-zA-Z-]+)/(.*)$');
            if (!match || !acc[match[1]]) {
                return acc;
            }
            if (!acc[match[1]][match[2]]) {
                acc[match[1]][match[2]] = {};
            }
            acc[match[1]][match[2]][match[3]] = entries[curr];
            return acc;
        }, {
            'exercises': [],
            'gamification-layers': []
        });

        const exercises_map = {};
        for (const key in result['exercises']) {
            if (result['exercises'].hasOwnProperty(key)) {
                const exercise = await this.exerciseService.importProcessEntries(
                    user, project.id, result['exercises'][key]
                );
                exercises_map[key] = exercise.id;
            }
        }

        const asyncImporters = [];

        Object.keys(result['gamification-layers']).forEach(related_entity_key => {
            asyncImporters.push(
                this.gamificationLayerService.importProcessEntries(
                    user, project.id, result['gamification-layers'][related_entity_key], exercises_map
                )
            );
        });

        await Promise.all(asyncImporters);
    }

    public async importMetadataFile(
        user: UserEntity, metadataFile: any
    ): Promise<ProjectEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const project = await this.repository.save({
            name: metadata.name,
            description: metadata.description,
            status: metadata.status,
            is_public: metadata.is_public,
            owner_id: user.id
        });

        await this.permissionService.addOwnerPermission(project.id, user.id);

        this.projectSyncQueue.add(PROJECT_SYNC_CREATE_REPO, { user, project });

        return project;
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

        const fileContents = await this.githubApiService.getFileContents(
            user, project.id, 'metadata.json'
        );
        archive.append(
            Buffer.from(fileContents.content, 'base64'),
            { name: 'metadata.json' }
        );

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

    public async getProjectUsers(project_id: string) {
        return await this.repository.createQueryBuilder('project')
            .leftJoin(PermissionEntity, 'permission', 'project.id = permission.project_id')
            .leftJoin(UserEntity, 'user', 'permission.user_id = user.id')
            .select('project.id, user.id AS id, user.first_name AS first_name, user.last_name AS last_name, permission.access_level AS access_level')
            .where(`project.id = '${project_id}'`)
            .getRawMany();
    }

    public async getAccessLevel(project_id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [],
            `project.id = '${project_id}'`,
            `permission.user_id = '${user_id}'`
        );
        return access_level;
    }

    private async countContributors(project_id: string): Promise<number> {
        return (await this.repository.createQueryBuilder('project')
            .leftJoin(PermissionEntity, 'permission', 'project.id = permission.project_id')
            .select('COUNT(*) AS count')
            .groupBy('permission.user_id')
            .where(`permission.project_id = '${project_id}'`)
            .getRawMany()).length;
    }

    private async countExercises(project_id: string): Promise<number> {
        return (await this.repository.createQueryBuilder('project')
            .leftJoin(ExerciseEntity, 'exercise', 'project.id = exercise.project_id')
            .select('COUNT(*) AS count')
            .groupBy('exercise.id')
            .where(`exercise.project_id = '${project_id}'`)
            .getRawMany()).length;
    }

    private async countGamificationLayers(project_id: string): Promise<number> {
        return (await this.repository.createQueryBuilder('project')
            .leftJoin(GamificationLayerEntity, 'gl', 'project.id = gl.project_id')
            .select('COUNT(*) AS count')
            .groupBy('gl.id')
            .where(`gl.project_id = '${project_id}'`)
            .getRawMany()).length;
    }
}
