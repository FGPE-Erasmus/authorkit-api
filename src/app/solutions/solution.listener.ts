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
    SOLUTION_CMD_CREATE,
    SOLUTION_CMD_UPDATE,
    SOLUTION_CMD_DELETE
} from './solution.constants';
import { SolutionEntity } from './entity/solution.entity';

@Controller()
export class SolutionListener {

    private logger = new AppLogger(SolutionListener.name);

    constructor(
        @InjectRepository(SolutionEntity)
        protected readonly repository: Repository<SolutionEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: SOLUTION_CMD_CREATE })
    public async onSolutionCreate(
        { user, solution, contents }: { user: UserEntity, solution: SolutionEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onSolutionCreate] Create solution in Github repository`);
            const exercise = await this.exerciseService.findOne(solution.exercise_id);

            // solution
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/solutions/${solution.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: solution.id,
                    pathname: solution.pathname,
                    lang: solution.lang
                })).toString('base64')
            );
            await this.repository.update(solution.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/solutions/${solution.id}/${solution.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(solution.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onSolutionCreate] Solution created in Github repository');
        } catch (err) {
            this.logger.error(`[onSolutionCreate] Solution NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: SOLUTION_CMD_UPDATE })
    public async onSolutionUpdate(
        { user, solution, contents }: { user: UserEntity, solution: SolutionEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onSolutionUpdate] Update solution in Github repository`);
            const exercise = await this.exerciseService.findOne(solution.exercise_id);

            // solution
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/solutions/${solution.id}/metadata.json`,
                solution.sha,
                Buffer.from(JSON.stringify({
                    id: solution.id,
                    pathname: solution.pathname,
                    lang: solution.lang
                })).toString('base64')
            );
            await this.repository.update(solution.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/solutions/${solution.id}/${solution.pathname}`,
                solution.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(solution.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onSolutionUpdate] Solution updated in Github repository');
        } catch (err) {
            this.logger.error(`[onSolutionUpdate] Solution NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: SOLUTION_CMD_DELETE })
    public async onSolutionDelete(
        { user, solution }: { user: UserEntity, solution: SolutionEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onSolutionDelete] Delete solution in Github repository`);
            const exercise = await this.exerciseService.findOne(solution.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/solutions/${solution.id}`
            );
            this.logger.debug('[onSolutionDelete] Solution deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onSolutionDelete] Solution NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
