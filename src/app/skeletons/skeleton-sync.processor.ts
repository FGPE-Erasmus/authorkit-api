import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    SKELETON_SYNC_QUEUE,
    SKELETON_SYNC_CREATE,
    SKELETON_SYNC_UPDATE,
    SKELETON_SYNC_DELETE
} from './skeleton.constants';
import { SkeletonEntity } from './entity/skeleton.entity';

@Processor(SKELETON_SYNC_QUEUE)
export class SkeletonSyncProcessor {

    private logger = new AppLogger(SkeletonSyncProcessor.name);

    constructor(
        @InjectRepository(SkeletonEntity)
        protected readonly repository: Repository<SkeletonEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @Process(SKELETON_SYNC_CREATE)
    public async onSkeletonCreate(job: Job) {
        this.logger.debug(`[onSkeletonCreate] Create skeleton in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // skeleton
        const res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/skeletons/${entity.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                lang: entity.lang
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        // file
        const file_res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/skeletons/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onSkeletonCreate] Skeleton created in Github repository');
    }

    @Process(SKELETON_SYNC_UPDATE)
    public async onSkeletonUpdate(job: Job) {
        this.logger.debug(`[onSkeletonUpdate] Update skeleton in Github repository`);

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // skeleton
        const res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/skeletons/${entity.id}/metadata.json`,
            entity.sha,
            Buffer.from(JSON.stringify({
                id: entity.id,
                pathname: entity.pathname,
                lang: entity.lang
            })).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res.content.sha });

        // file
        const file_res = await this.githubApiService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/skeletons/${entity.id}/${entity.pathname}`,
            entity.file.sha,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, { file: { sha: file_res.content.sha } });

        this.logger.debug('[onSkeletonUpdate] Skeleton updated in Github repository');
    }

    @Process(SKELETON_SYNC_DELETE)
    public async onSkeletonDelete(job: Job) {
        this.logger.debug(`[onSkeletonDelete] Delete skeleton in Github repository`);

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.githubApiService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/skeletons/${entity.id}`
        );
        this.logger.debug('[onSkeletonDelete] Skeleton deleted in Github repository');
    }
}
