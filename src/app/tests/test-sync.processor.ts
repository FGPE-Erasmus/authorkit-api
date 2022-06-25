import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GitService } from '../git/git.service';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    TEST_SYNC_QUEUE,
    TEST_SYNC_CREATE,
    TEST_SYNC_UPDATE,
    TEST_SYNC_DELETE,
    TEST_INPUT_SYNC_CREATE,
    TEST_INPUT_SYNC_UPDATE,
    TEST_OUTPUT_SYNC_CREATE,
    TEST_OUTPUT_SYNC_UPDATE
} from './test.constants';
import { TestEntity } from './entity/test.entity';

@Processor(TEST_SYNC_QUEUE)
export class TestSyncProcessor {
    private logger = new AppLogger(TestSyncProcessor.name);

    constructor(
        @InjectRepository(TestEntity)
        protected readonly repository: Repository<TestEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly gitService: GitService,
        protected readonly userService: UserService
    ) {}

    @Process(TEST_SYNC_CREATE)
    public async onTestCreate(job: Job) {
        this.logger.debug(`[onTestCreate] Create test in Github repository`);

        const { user, test } = job.data;

        const exercise = await this.exerciseService.findOne(test.exercise_id);
        let testset_path = '';
        if (test.testset_id) {
            testset_path = `testsets/${test.testset_id}/`;
        }

        // test
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/${testset_path}tests/${test.id}/metadata.json`,
            Buffer.from(
                JSON.stringify({
                    id: test.id,
                    arguments: test.arguments,
                    weight: test.weight,
                    visible: test.visible,
                    input: test.input.pathname,
                    output: test.output.pathname,
                    timeout: exercise.timeout,
                    feedback: test.feedback
                })
            ).toString('base64')
        );
        await this.repository.update(test.id, { sha: res });

        this.logger.debug('[onTestCreate] Test created in Github repository');
    }

    @Process(TEST_SYNC_UPDATE)
    public async onTestUpdate(job: Job) {
        this.logger.debug(`[onTestUpdate] Update test in Github repository`);

        const { user, test } = job.data;

        const exercise = await this.exerciseService.findOne(test.exercise_id);
        let testset_path = '';
        if (test.testset_id) {
            testset_path = `testsets/${test.testset_id}/`;
        }

        // test
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/${testset_path}tests/${test.id}/metadata.json`,
            Buffer.from(
                JSON.stringify({
                    id: test.id,
                    arguments: test.arguments,
                    weight: test.weight,
                    visible: test.visible,
                    input: test.input.pathname,
                    output: test.output.pathname,
                    timeout: test.timeout,
                    feedback: test.feedback
                })
            ).toString('base64')
        );
        await this.repository.update(test.id, { sha: res });

        this.logger.debug('[onTestUpdate] Test updated in Github repository');
    }

    @Process(TEST_SYNC_DELETE)
    public async onTestDelete(job: Job) {
        this.logger.debug(`[onTestDelete] Delete test in Github repository`);

        const { user, test } = job.data;

        const exercise = await this.exerciseService.findOne(test.exercise_id);
        let testset_path = '';
        if (test.testset_id) {
            testset_path = `testsets/${test.testset_id}/`;
        }
        await this.gitService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/${testset_path}tests/${test.id}`
        );

        this.logger.debug('[onTestDelete] Test deleted in Github repository');
    }

    @Process(TEST_INPUT_SYNC_CREATE)
    public async onTestInputCreate(job: Job) {
        this.logger.debug(
            `[onTestInputCreate] Create test input in Github repository`
        );

        const { user, test, content } = job.data;

        const exercise = await this.exerciseService.findOne(test.exercise_id);
        let testset_path = '';
        if (test.testset_id) {
            testset_path = `testsets/${test.testset_id}/`;
        }
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.input.pathname}`,
            Buffer.from(content.buffer).toString('base64')
        );
        await this.repository.update(test.id, {
            input: { pathname: test.input.pathname, sha: res }
        });

        this.logger.debug(
            '[onTestInputCreate] Test input created in Github repository'
        );
    }

    @Process(TEST_INPUT_SYNC_UPDATE)
    public async onTestInputUpdate(job: Job) {
        this.logger.debug(
            `[onTestInputUpdate] Update test input in Github repository`
        );

        const { user, test, content } = job.data;

        const exercise = await this.exerciseService.findOne(test.exercise_id);
        let testset_path = '';
        if (test.testset_id) {
            testset_path = `testsets/${test.testset_id}/`;
        }
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.input.pathname}`,
            Buffer.from(content.buffer).toString('base64')
        );
        await this.repository.update(test.id, {
            input: { pathname: test.input.pathname, sha: res }
        });

        this.logger.debug(
            '[onTestInputUpdate] Test input updated in Github repository'
        );
    }

    @Process(TEST_OUTPUT_SYNC_CREATE)
    public async onTestOutputCreate(job: Job) {
        this.logger.debug(
            `[onTestOutputCreate] Create test output in Github repository`
        );

        const { user, test, content } = job.data;

        const exercise = await this.exerciseService.findOne(test.exercise_id);
        let testset_path = '';
        if (test.testset_id) {
            testset_path = `testsets/${test.testset_id}/`;
        }
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.output.pathname}`,
            Buffer.from(content.buffer).toString('base64')
        );
        await this.repository.update(test.id, {
            output: { pathname: test.output.pathname, sha: res }
        });

        this.logger.debug(
            '[onTestOutputCreate] Test output created in Github repository'
        );
    }

    @Process(TEST_OUTPUT_SYNC_UPDATE)
    public async onTestOutputUpdate(job: Job) {
        this.logger.debug(
            `[onTestOutputUpdate] Update test output in Github repository`
        );

        const { user, test, content } = job.data;

        const exercise = await this.exerciseService.findOne(test.exercise_id);
        let testset_path = '';
        if (test.testset_id) {
            testset_path = `testsets/${test.testset_id}/`;
        }
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.output.pathname}`,
            Buffer.from(content.buffer).toString('base64')
        );
        await this.repository.update(test.id, {
            output: { pathname: test.output.pathname, sha: res }
        });

        this.logger.debug(
            '[onTestOutputUpdate] Test output updated in Github repository'
        );
    }
}
