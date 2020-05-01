import { Injectable, InternalServerErrorException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { ExerciseService } from '../exercises/exercise.service';
import { ExerciseEntity } from '../exercises/entity/exercise.entity';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity';

import {
    LIBRARY_SYNC_QUEUE,
    LIBRARY_SYNC_CREATE,
    LIBRARY_SYNC_UPDATE,
    LIBRARY_SYNC_DELETE,
    LIBRARY_SYNC_CREATE_FILE,
    LIBRARY_SYNC_UPDATE_FILE
} from './library.constants';
import { LibraryEntity } from './entity/library.entity';


@Injectable()
export class LibraryService {

    private logger = new AppLogger(LibraryService.name);

    constructor(
        @InjectRepository(LibraryEntity)
        protected readonly repository: Repository<LibraryEntity>,

        @InjectQueue(LIBRARY_SYNC_QUEUE) private readonly librarySyncQueue: Queue,

        protected readonly githubApiService: GithubApiService,

        @Inject(forwardRef(() => ExerciseService))
        protected readonly exerciseService: ExerciseService
    ) {
    }

    public async getContents(user: UserEntity, id: string):
            Promise<any> {
        const entity = await this.repository.findOneOrFail(id);
        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        try {
            const response = await this.githubApiService.getFileContents(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/libraries/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${entity.pathname}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<LibraryEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get library`, e);
        }
    }

    public async createOne(user: UserEntity, dto: LibraryEntity, file: any):
            Promise<LibraryEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(plainToClass(LibraryEntity, dto));
            this.librarySyncQueue.add(LIBRARY_SYNC_CREATE, { user, entity });
            this.librarySyncQueue.add(
                LIBRARY_SYNC_CREATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create library`, e);
        }
    }

    public async updateOne(user: UserEntity, id: string, dto: LibraryEntity, file: any):
            Promise<LibraryEntity> {
        const library = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(LibraryEntity, { ...library, ...dto })
            );
            this.librarySyncQueue.add(LIBRARY_SYNC_UPDATE, { user, entity });
            this.librarySyncQueue.add(
                LIBRARY_SYNC_UPDATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update library`, e);
        }
    }

    public async deleteOne(user: UserEntity, id: string): Promise<LibraryEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete library`, e);
        }
        this.librarySyncQueue.add(LIBRARY_SYNC_DELETE, { user, entity });
        return entity;
    }

    public async importProcessEntries(
        user: UserEntity, exercise: ExerciseEntity, entries: any
    ): Promise<void> {

        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            throw new BadRequestException('Archive misses required metadata');
        }

        const entity = await this.importMetadataFile(user, exercise, root_metadata);

        if (!entries[entity.pathname]) {
            throw new BadRequestException('Archive misses referenced file');
        }

        this.librarySyncQueue.add(
            LIBRARY_SYNC_CREATE_FILE,
            {
                user, entity, file: { buffer: (await entries[entity.pathname].buffer()) }
            },
            { delay: 1000 }
        );
    }

    public async importMetadataFile(
        user: UserEntity, exercise: ExerciseEntity, metadataFile: any
    ): Promise<LibraryEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: LibraryEntity = await this.repository.save({
            pathname: metadata.pathname,
            exercise_id: exercise.id
        });

        this.librarySyncQueue.add(
            LIBRARY_SYNC_CREATE, { user, entity }
        );

        return entity;
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'library', prop: 'libraries' }
            ],
            `library.id = '${id}'`,
            `permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
