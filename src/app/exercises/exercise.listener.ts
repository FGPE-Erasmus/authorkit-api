import { Controller } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';

import { EXERCISE_CMD_CREATE, EXERCISE_CMD_UPDATE, EXERCISE_CMD_DELETE } from './exercise.constants';
import { ExerciseEntity } from './entity/exercise.entity';

@Controller()
export class ExerciseListener {

    private logger = new AppLogger(ExerciseListener.name);

    constructor(
        @InjectRepository(ExerciseEntity)
        protected readonly repository: Repository<ExerciseEntity>,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: EXERCISE_CMD_CREATE })
    public async onExerciseCreate(
        { user, exercise }: { user: UserEntity, exercise: ExerciseEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onExerciseCreate] Create exercise in Github repository`);
            const owner = await this.userService.findOne(exercise.owner_id);
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: exercise.id,
                    title: exercise.title,
                    module: exercise.module,
                    owner: `${owner.first_name} ${owner.last_name}`,
                    keywords: exercise.keywords,
                    type: exercise.type,
                    event: exercise.event,
                    platform: exercise.platform,
                    difficulty: exercise.difficulty,
                    status: exercise.status,
                    created_at: exercise.created_at,
                    updated_at: exercise.updated_at
                })).toString('base64')
            );
            await this.repository.update(exercise.id, { sha: res.content.sha });
            this.logger.debug('[onExerciseCreate] Exercise created in Github repository');
        } catch (err) {
            this.logger.error(`[onExerciseCreate] Exercise NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: EXERCISE_CMD_UPDATE })
    public async onExerciseUpdate(
        { user, exercise }: { user: UserEntity, exercise: ExerciseEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onExerciseUpdate] Update exercise in Github repository`);
            const owner = await this.userService.findOne(exercise.owner_id);
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/metadata.json`,
                exercise.sha,
                Buffer.from(JSON.stringify({
                    id: exercise.id,
                    title: exercise.title,
                    module: exercise.module,
                    owner: `${owner.first_name} ${owner.last_name}`,
                    keywords: exercise.keywords,
                    type: exercise.type,
                    event: exercise.event,
                    platform: exercise.platform,
                    difficulty: exercise.difficulty,
                    status: exercise.status,
                    created_at: exercise.created_at,
                    updated_at: exercise.updated_at
                })).toString('base64')
            );
            await this.repository.update(exercise.id, { sha: res.content.sha });
            this.logger.debug('[onExerciseUpdate] Exercise updated in Github repository');
        } catch (err) {
            this.logger.error(`[onExerciseUpdate] Exercise NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: EXERCISE_CMD_DELETE })
    public async onExerciseDelete(
        { user, exercise }: { user: UserEntity, exercise: ExerciseEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onExerciseDelete] Delete exercise in Github repository`);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}`
            );
            this.logger.debug('[onExerciseDelete] Exercise deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onExerciseDelete] Exercise NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}
