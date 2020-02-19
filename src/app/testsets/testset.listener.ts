import { Controller } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';

import { ExerciseService } from '../exercises/exercise.service';
import { TestEntity } from '../tests/entity/test.entity';

import {
    TESTSET_CMD_CREATE,
    TESTSET_CMD_UPDATE,
    TESTSET_CMD_DELETE
} from './testset.constants';
import { TestSetEntity } from './entity/testset.entity';

@Controller()
export class TestSetListener {

    private logger = new AppLogger(TestSetListener.name);

    constructor(
        @InjectRepository(TestSetEntity)
        protected readonly repository: Repository<TestSetEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: TESTSET_CMD_CREATE })
    public async onTestSetCreate(
        { user, testset }: { user: UserEntity, testset: TestSetEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestSetCreate] Create test set in Github repository`);
            const exercise = await this.exerciseService.findOne(testset.exercise_id);
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/testsets/${testset.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: testset.id,
                    name: testset.name,
                    weight: testset.weight,
                    visible: testset.visible
                })).toString('base64')
            );
            await this.repository.update(testset.id, { sha: res.content.sha });
            this.logger.debug('[onTestSetCreate] Test set created in Github repository');
        } catch (err) {
            this.logger.error(`[onTestSetCreate] Test set NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TESTSET_CMD_UPDATE })
    public async onTestSetUpdate(
        { user, testset }: { user: UserEntity, testset: TestSetEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestSetUpdate] Update test set in Github repository`);
            const exercise = await this.exerciseService.findOne(testset.exercise_id);
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/testsets/${testset.id}/metadata.json`,
                testset.sha,
                Buffer.from(JSON.stringify({
                    id: testset.id,
                    name: testset.name,
                    weight: testset.weight,
                    visible: testset.visible
                })).toString('base64')
            );
            await this.repository.update(testset.id, { sha: res.content.sha });
            this.logger.debug('[onTestSetUpdate] Test set updated in Github repository');
        } catch (err) {
            this.logger.error(`[onTestSetUpdate] Test set NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TESTSET_CMD_DELETE })
    public async onTestSetDelete(
        { user, testset }: { user: UserEntity, testset: TestSetEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestSetDelete] Delete test set in Github repository`);
            const exercise = await this.exerciseService.findOne(testset.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/testsets/${testset.id}/`
            );
            this.logger.debug('[onTestSetDelete] Test set deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onTestSetDelete] Test set NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}
