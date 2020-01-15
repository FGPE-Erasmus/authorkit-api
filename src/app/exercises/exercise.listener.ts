import { Controller } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';

import { EXERCISE_CMD_CREATE, EXERCISE_CMD_UPDATE, EXERCISE_CMD_DELETE } from './exercise.constants';
import { ExerciseEntity } from './entity/exercise.entity';

@Controller()
export class ExerciseListener {

    private logger = new AppLogger(ExerciseListener.name);

    constructor(
        @InjectRepository(ExerciseEntity)
        protected readonly repository: Repository<ExerciseEntity>,
        protected readonly githubApiService: GithubApiService
    ) { }

    @MessagePattern({ cmd: EXERCISE_CMD_CREATE })
    public async onExerciseCreate(exercise: ExerciseEntity): Promise<void> {
        try {
            this.logger.debug(`[onExerciseCreate] Create exercise in Github repository`);
            const result = await this.githubApiService.createOrUpdateExerciseTree(exercise);
            await this.repository.update(exercise.id, { sha: result.commit.tree.sha });
            this.logger.debug('[onExerciseCreate] Exercise created in Github repository');
        } catch (err) {
            this.logger.error(`[onExerciseCreate] Exercise NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: EXERCISE_CMD_UPDATE })
    public async onExerciseUpdate(exercise: ExerciseEntity): Promise<void> {
        try {
            this.logger.debug(`[onExerciseUpdate] Update exercise in Github repository`);
            const result = await this.githubApiService.createOrUpdateExerciseTree(exercise);
            await this.repository.update(exercise.id, { sha: result.commit.tree.sha });
            this.logger.debug('[onExerciseUpdate] Exercise updated in Github repository');
        } catch (err) {
            this.logger.error(`[onExerciseUpdate] Exercise NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: EXERCISE_CMD_DELETE })
    public async onExerciseDelete(exercise: ExerciseEntity): Promise<void> {
        try {
            this.logger.debug(`[onExerciseDelete] Delete exercise in Github repository`);
            await this.githubApiService.deleteExerciseTree(exercise);
            this.logger.debug('[onExerciseDelete] Exercise deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onExerciseDelete] Exercise NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}
