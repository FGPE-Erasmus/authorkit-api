import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
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
import { ExerciseService } from '../exercises/exercise.service';
import { GamificationLayerService } from '../gamification-layers/gamification-layer.service';

import { ProjectEntity } from './entity/project.entity';
import { PROJECT_SYNC_QUEUE, PROJECT_SYNC_CREATE_REPO } from './project.constants';

@Injectable()
export class ProjectService extends TypeOrmCrudService<ProjectEntity> {

    private logger = new AppLogger(ProjectService.name);

    constructor(
        @InjectRepository(ProjectEntity) protected readonly repository: Repository<ProjectEntity>,
        @InjectQueue(PROJECT_SYNC_QUEUE) private readonly projectSyncQueue: Queue,

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

        console.log(exercises_map);

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

        const asyncArchiveWriters = [];

        const fileContents = await this.githubApiService.getFileContents(
            user, project.id, 'metadata.json'
        );
        archive.append(
            Buffer.from(fileContents.content, 'base64'),
            { name: 'metadata.json' }
        );

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
