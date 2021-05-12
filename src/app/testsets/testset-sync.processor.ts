import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserService } from '../user/user.service';

import { ExerciseService } from '../exercises/exercise.service';

import {
    TESTSET_SYNC_QUEUE,
    TESTSET_SYNC_CREATE,
    TESTSET_SYNC_UPDATE,
    TESTSET_SYNC_DELETE
} from './testset.constants';
import { TestSetEntity } from './entity/testset.entity';

@Processor(TESTSET_SYNC_QUEUE)
export class TestSetSyncProcessor {

    private logger = new AppLogger(TestSetSyncProcessor.name);

    constructor(
        @InjectRepository(TestSetEntity)
        protected readonly repository: Repository<TestSetEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @Process(TESTSET_SYNC_CREATE)
    public async onTestSetCreate(job: Job) {
        this.logger.debug(`[onTestSetCreate] Create test set in Github repository`);
        const { user, testset } = job.data;
        const exercise = await this.exerciseService.findOne(testset.exercise_id);
        const res = await this.githubApiService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/testsets/${testset.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: testset.id,
                name: testset.name,
                weight: testset.weight,
                visible: testset.visible,
                tests: testset.tests
            })).toString('base64')
        );
        await this.repository.update(testset.id, { sha: res.content.sha });
        this.logger.debug('[onTestSetCreate] Test set created in Github repository');
    }

    @Process(TESTSET_SYNC_UPDATE)
    public async onTestSetUpdate(job: Job) {
        this.logger.debug(`[onTestSetUpdate] Update test set in Github repository`);
        const { user, testset } = job.data;
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
                visible: testset.visible,
                tests: testset.tests
            })).toString('base64')
        );
        await this.repository.update(testset.id, { sha: res.content.sha });
        this.logger.debug('[onTestSetUpdate] Test set updated in Github repository');
    }

    @Process(TESTSET_SYNC_DELETE)
    public async onTestSetDelete(job: Job) {
        this.logger.debug(`[onTestSetDelete] Delete test set in Github repository`);
        const { user, testset } = job.data;
        const exercise = await this.exerciseService.findOne(testset.exercise_id);
        await this.githubApiService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/testsets/${testset.id}/`
        );
        this.logger.debug('[onTestSetDelete] Test set deleted in Github repository');
    }
}
