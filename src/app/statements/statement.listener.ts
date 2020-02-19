import { Controller } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    STATEMENT_CMD_CREATE,
    STATEMENT_CMD_UPDATE,
    STATEMENT_CMD_DELETE
} from './statement.constants';
import { StatementEntity } from './entity/statement.entity';

@Controller()
export class StatementListener {

    private logger = new AppLogger(StatementListener.name);

    constructor(
        @InjectRepository(StatementEntity)
        protected readonly repository: Repository<StatementEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: STATEMENT_CMD_CREATE })
    public async onStatementCreate(
        { user, statement, contents }: { user: UserEntity, statement: StatementEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onStatementCreate] Create statement in Github repository`);
            const exercise = await this.exerciseService.findOne(statement.exercise_id);

            // statement
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/statements/${statement.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: statement.id,
                    pathname: statement.pathname,
                    nat_lang: statement.nat_lang,
                    format: statement.format
                })).toString('base64')
            );
            await this.repository.update(statement.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/statements/${statement.id}/${statement.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(statement.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onStatementCreate] Statement created in Github repository');
        } catch (err) {
            this.logger.error(`[onStatementCreate] Statement NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: STATEMENT_CMD_UPDATE })
    public async onStatementUpdate(
        { user, statement, contents }: { user: UserEntity, statement: StatementEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onStatementUpdate] Update statement in Github repository`);
            const exercise = await this.exerciseService.findOne(statement.exercise_id);

            // statement
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/statements/${statement.id}/metadata.json`,
                statement.sha,
                Buffer.from(JSON.stringify({
                    id: statement.id,
                    pathname: statement.pathname,
                    nat_lang: statement.nat_lang,
                    format: statement.format
                })).toString('base64')
            );
            await this.repository.update(statement.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/statements/${statement.id}/${statement.pathname}`,
                statement.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(statement.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onStatementUpdate] Statement updated in Github repository');
        } catch (err) {
            this.logger.error(`[onStatementUpdate] Statement NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: STATEMENT_CMD_DELETE })
    public async onStatementDelete(
        { user, statement }: { user: UserEntity, statement: StatementEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onStatementDelete] Delete statement in Github repository`);
            const exercise = await this.exerciseService.findOne(statement.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/statements/${statement.id}`
            );
            this.logger.debug('[onStatementDelete] Statement deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onStatementDelete] Statement NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
