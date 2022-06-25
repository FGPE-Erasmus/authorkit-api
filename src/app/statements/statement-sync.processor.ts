import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GitService } from '../git/git.service';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    STATEMENT_SYNC_QUEUE,
    STATEMENT_SYNC_CREATE,
    STATEMENT_SYNC_UPDATE,
    STATEMENT_SYNC_DELETE,
    STATEMENT_SYNC_CREATE_FILE,
    STATEMENT_SYNC_UPDATE_FILE
} from './statement.constants';
import { StatementEntity } from './entity/statement.entity';

@Processor(STATEMENT_SYNC_QUEUE)
export class StatementSyncProcessor {
    private logger = new AppLogger(StatementSyncProcessor.name);

    constructor(
        @InjectRepository(StatementEntity)
        protected readonly repository: Repository<StatementEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly gitService: GitService,
        protected readonly userService: UserService
    ) {}

    @Process(STATEMENT_SYNC_CREATE)
    public async onStatementCreate(job: Job) {
        this.logger.debug(
            `[onStatementCreate] Create statement in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // statement
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/statements/${entity.id}/metadata.json`,
            Buffer.from(
                JSON.stringify({
                    id: entity.id,
                    pathname: entity.pathname,
                    nat_lang: entity.nat_lang,
                    format: entity.format?.toUpperCase()
                })
            ).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res });

        this.logger.debug(
            '[onStatementCreate] Statement created in Github repository'
        );
    }

    @Process(STATEMENT_SYNC_CREATE_FILE)
    public async onStatementCreateFile(job: Job) {
        this.logger.debug(
            `[onStatementCreateFile] Create statement file in Github repository`
        );

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/statements/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, {
            file: { sha: res }
        });

        this.logger.debug(
            '[onStatementCreateFile] Statement file created in Github repository'
        );
    }

    @Process(STATEMENT_SYNC_UPDATE)
    public async onStatementUpdate(job: Job) {
        this.logger.debug(
            `[onStatementUpdate] Update statement in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // statement
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/statements/${entity.id}/metadata.json`,
            Buffer.from(
                JSON.stringify({
                    id: entity.id,
                    pathname: entity.pathname,
                    nat_lang: entity.nat_lang,
                    format: entity.format?.toUpperCase()
                })
            ).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res });

        this.logger.debug(
            '[onStatementUpdate] Statement updated in Github repository'
        );
    }

    @Process(STATEMENT_SYNC_UPDATE_FILE)
    public async onStatementUpdateFile(job: Job) {
        this.logger.debug(
            `[onStatementUpdateFile] Update statement file in Github repository`
        );

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/statements/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, {
            file: { sha: res }
        });

        this.logger.debug(
            '[onStatementUpdateFile] Statement file updated in Github repository'
        );
    }

    @Process(STATEMENT_SYNC_DELETE)
    public async onStatementDelete(job: Job) {
        this.logger.debug(
            `[onStatementDelete] Delete statement in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.gitService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/statements/${entity.id}`
        );

        this.logger.debug(
            '[onStatementDelete] Statement deleted in Github repository'
        );
    }
}
