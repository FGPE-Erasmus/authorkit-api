import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserService } from '../user/user.service';

import {
    EXERCISE_SYNC_QUEUE,
    EXERCISE_SYNC_CREATE,
    EXERCISE_SYNC_UPDATE,
    EXERCISE_SYNC_DELETE
} from './exercise.constants';
import { ExerciseEntity } from './entity/exercise.entity';

@Processor(EXERCISE_SYNC_QUEUE)
export class ExerciseSyncProcessor {

    private logger = new AppLogger(ExerciseSyncProcessor.name);

    constructor(
        @InjectRepository(ExerciseEntity)
        protected readonly repository: Repository<ExerciseEntity>,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @Process(EXERCISE_SYNC_CREATE)
    public async onExerciseCreate(job: Job) {
        // this.logger.debug(`[onExerciseCreate] Create exercise in Github repository`);
        const { user, exercise } = job.data;
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
                timeout: exercise.timeout,
                programmingLanguages: exercise.programmingLanguages,
                instructions: exercise.instructions,
                statements: exercise.statements,
                embeddables: exercise.embeddables,
                libraries: exercise.libraries,
                static_correctors: exercise.static_correctors,
                dynamic_correctors: exercise.dynamic_correctors,
                test_generators: exercise.test_generators,
                feedback_generators: exercise.feedback_generators,
                skeletons: exercise.skeletons,
                solutions: exercise.solutions,
                templates: exercise.templates,
                tests: exercise.tests,
                testsets: exercise.test_sets,
                created_at: exercise.created_at,
                updated_at: exercise.updated_at
            })).toString('base64')
        );
        await this.repository.update(exercise.id, { sha: res.content.sha });
        // this.logger.debug('[onExerciseCreate] Exercise created in Github repository');
    }

    @Process(EXERCISE_SYNC_UPDATE)
    public async onExerciseUpdate(job: Job) {
        // this.logger.debug(`[onExerciseUpdate] Update exercise in Github repository`);

        const { user, exercise } = job.data;
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
                timeout: exercise.timeout,
                programmingLanguages: exercise.programmingLanguages,
                instructions: exercise.instructions,
                statements: exercise.statements,
                embeddables: exercise.embeddables,
                libraries: exercise.libraries,
                static_correctors: exercise.static_correctors,
                dynamic_correctors: exercise.dynamic_correctors,
                test_generators: exercise.test_generators,
                feedback_generators: exercise.feedback_generators,
                skeletons: exercise.skeletons,
                solutions: exercise.solutions,
                templates: exercise.templates,
                tests: exercise.tests,
                testsets: exercise.test_sets,
                created_at: exercise.created_at,
                updated_at: exercise.updated_at
            })).toString('base64')
        );
        await this.repository.update(exercise.id, { sha: res.content.sha });

        // this.logger.debug('[onExerciseUpdate] Exercise updated in Github repository');
    }

    @Process(EXERCISE_SYNC_DELETE)
    public async onExerciseDelete(job: Job) {
        // this.logger.debug(`[onExerciseDelete] Delete exercise in Github repository`);

        const { user, exercise } = job.data;
        await this.githubApiService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}`
        );

        // this.logger.debug('[onExerciseDelete] Exercise deleted in Github repository');
    }
}
