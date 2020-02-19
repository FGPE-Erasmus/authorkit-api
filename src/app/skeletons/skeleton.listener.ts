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
    SKELETON_CMD_CREATE,
    SKELETON_CMD_UPDATE,
    SKELETON_CMD_DELETE
} from './skeleton.constants';
import { SkeletonEntity } from './entity/skeleton.entity';

@Controller()
export class SkeletonListener {

    private logger = new AppLogger(SkeletonListener.name);

    constructor(
        @InjectRepository(SkeletonEntity)
        protected readonly repository: Repository<SkeletonEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: SKELETON_CMD_CREATE })
    public async onSkeletonCreate(
        { user, skeleton, contents }: { user: UserEntity, skeleton: SkeletonEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onSkeletonCreate] Create skeleton in Github repository`);
            const exercise = await this.exerciseService.findOne(skeleton.exercise_id);

            // skeleton
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/skeletons/${skeleton.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: skeleton.id,
                    pathname: skeleton.pathname,
                    lang: skeleton.lang
                })).toString('base64')
            );
            await this.repository.update(skeleton.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/skeletons/${skeleton.id}/${skeleton.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(skeleton.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onSkeletonCreate] Skeleton created in Github repository');
        } catch (err) {
            this.logger.error(`[onSkeletonCreate] Skeleton NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: SKELETON_CMD_UPDATE })
    public async onSkeletonUpdate(
        { user, skeleton, contents }: { user: UserEntity, skeleton: SkeletonEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onSkeletonUpdate] Update skeleton in Github repository`);
            const exercise = await this.exerciseService.findOne(skeleton.exercise_id);

            // skeleton
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/skeletons/${skeleton.id}/metadata.json`,
                skeleton.sha,
                Buffer.from(JSON.stringify({
                    id: skeleton.id,
                    pathname: skeleton.pathname,
                    lang: skeleton.lang
                })).toString('base64')
            );
            await this.repository.update(skeleton.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/skeletons/${skeleton.id}/${skeleton.pathname}`,
                skeleton.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(skeleton.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onSkeletonUpdate] Skeleton updated in Github repository');
        } catch (err) {
            this.logger.error(`[onSkeletonUpdate] Skeleton NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: SKELETON_CMD_DELETE })
    public async onSkeletonDelete(
        { user, skeleton }: { user: UserEntity, skeleton: SkeletonEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onSkeletonDelete] Delete skeleton in Github repository`);
            const exercise = await this.exerciseService.findOne(skeleton.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/skeletons/${skeleton.id}`
            );
            this.logger.debug('[onSkeletonDelete] Skeleton deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onSkeletonDelete] Skeleton NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
