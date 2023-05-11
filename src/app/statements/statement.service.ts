import { Injectable, InternalServerErrorException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import translate, { languages } from 'translation-google';

import { AppLogger } from '../app.logger';
import { TextFormat } from '../_helpers';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { ExerciseEntity } from '../exercises/entity/exercise.entity';
import { ExerciseService } from '../exercises/exercise.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity';

import {
    STATEMENT_SYNC_QUEUE,
    STATEMENT_SYNC_CREATE,
    STATEMENT_SYNC_UPDATE,
    STATEMENT_SYNC_DELETE,
    STATEMENT_SYNC_CREATE_FILE,
    STATEMENT_SYNC_UPDATE_FILE
} from './statement.constants';
import { StatementEntity } from './entity/statement.entity';


@Injectable()
export class StatementService {

    private logger = new AppLogger(StatementService.name);

    constructor(
        @InjectRepository(StatementEntity)
        protected readonly repository: Repository<StatementEntity>,

        @InjectQueue(STATEMENT_SYNC_QUEUE) private readonly statementSyncQueue: Queue,

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
                `exercises/${exercise.id}/statements/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${entity.pathname}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<StatementEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get statement`, e);
        }
    }

    public async createOne(user: UserEntity, dto: StatementEntity, file: any):
            Promise<StatementEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(plainToClass(StatementEntity, dto));
            this.statementSyncQueue.add(STATEMENT_SYNC_CREATE, { user, entity });
            this.statementSyncQueue.add(
                STATEMENT_SYNC_CREATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create statement`, e);
        }
    }

    public async updateOne(user: UserEntity, id: string, dto: StatementEntity, file: any):
            Promise<StatementEntity> {
        const statement = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(StatementEntity, { ...statement, ...dto })
            );
            this.statementSyncQueue.add(STATEMENT_SYNC_UPDATE, { user, entity });
            this.statementSyncQueue.add(
                STATEMENT_SYNC_UPDATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update statement`, e);
        }
    }

    public async deleteOne(user: UserEntity, id: string): Promise<StatementEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete statement`, e);
        }
        this.statementSyncQueue.add(STATEMENT_SYNC_DELETE, { user, entity });
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

        this.statementSyncQueue.add(
            STATEMENT_SYNC_CREATE_FILE,
            {
                user, entity, file: { buffer: (await entries[entity.pathname].buffer()) }
            },
            { delay: 1000 }
        );
    }

    public async importMetadataFile(
        user: UserEntity, exercise: ExerciseEntity, metadataFile: any
    ): Promise<StatementEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: StatementEntity = await this.repository.save({
            format: metadata.format?.toLowerCase(),
            nat_lang: metadata.nat_lang,
            pathname: metadata.pathname,
            exercise_id: exercise.id
        });

        this.statementSyncQueue.add(
            STATEMENT_SYNC_CREATE, { user, entity }
        );

        return entity;
    }

    public async translate(
        user: UserEntity, id: string, nat_lang: string
    ): Promise<StatementEntity> {
        const statement = await this.getOne(user, id);
        if (statement.format !== TextFormat.TXT
            && statement.format !== TextFormat.HTML
            && statement.format !== TextFormat.MARKDOWN
        ) {
            throw new BadRequestException(`Cannot translate statements in ${statement.format}`);
        }
        let contents = Buffer.from(await this.getContents(user, id), 'base64').toString('utf8');
        if (statement.nat_lang !== nat_lang
            && languages[nat_lang]
            && languages[statement.nat_lang]) {
            const translated = await translate(contents, {from: statement.nat_lang, to: nat_lang});
            contents = translated.text;
        }
        return this.createOne(user, {
            exercise_id: statement.exercise_id,
            format: statement.format,
            nat_lang
        } as StatementEntity, {
            originalname: nat_lang + '_' + (
                statement.pathname.startsWith(`${statement.nat_lang}_`) ?
                statement.pathname.substr(statement.nat_lang.length + 1) :
                statement.pathname),
            buffer: Buffer.from(contents)
        });
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'statement', prop: 'statements' }
            ],
            `statement.id = '${id}'`,
            `permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
