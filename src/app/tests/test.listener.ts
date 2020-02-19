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
    TEST_CMD_CREATE,
    TEST_CMD_UPDATE,
    TEST_CMD_DELETE,
    TEST_INPUT_CMD_CREATE,
    TEST_INPUT_CMD_UPDATE,
    TEST_OUTPUT_CMD_UPDATE,
    TEST_OUTPUT_CMD_CREATE
} from './test.constants';
import { TestEntity } from './entity/test.entity';

@Controller()
export class TestListener {

    private logger = new AppLogger(TestListener.name);

    constructor(
        @InjectRepository(TestEntity)
        protected readonly repository: Repository<TestEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: TEST_CMD_CREATE })
    public async onTestCreate(
        { user, test, input, output }: { user: UserEntity, test: TestEntity, input: any, output: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestCreate] Create test in Github repository`);
            const exercise = await this.exerciseService.findOne(test.exercise_id);
            let testset_path = '';
            if (test.testset_id) {
                testset_path = `testsets/${test.testset_id}/`;
            }

            // test
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: test.id,
                    arguments: test.arguments,
                    weight: test.weight,
                    visible: test.visible,
                    input: test.input.pathname,
                    output: test.output.pathname
                })).toString('base64')
            );
            await this.repository.update(test.id, { sha: res.content.sha });

            // input
            const input_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.input.pathname}`,
                Buffer.from(input.buffer).toString('base64')
            );
            await this.repository.update(test.id, {
                input: { pathname: test.input.pathname, sha: input_res.content.sha }
            });

            // output
            const output_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.output.pathname}`,
                Buffer.from(output.buffer).toString('base64')
            );
            await this.repository.update(test.id, {
                output: { pathname: test.output.pathname, sha: output_res.content.sha }
            });

            this.logger.debug('[onTestCreate] Test created in Github repository');
        } catch (err) {
            this.logger.error(`[onTestCreate] Test NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TEST_CMD_UPDATE })
    public async onTestUpdate(
        { user, test, input, output }: { user: UserEntity, test: TestEntity, input: any, output: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestUpdate] Update test in Github repository`);
            const exercise = await this.exerciseService.findOne(test.exercise_id);
            let testset_path = '';
            if (test.testset_id) {
                testset_path = `testsets/${test.testset_id}/`;
            }

            // test
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/metadata.json`,
                test.sha,
                Buffer.from(JSON.stringify({
                    id: test.id,
                    arguments: test.arguments,
                    weight: test.weight,
                    visible: test.visible,
                    input: test.input.pathname,
                    output: test.output.pathname
                })).toString('base64')
            );
            await this.repository.update(test.id, { sha: res.content.sha });

            // input
            const input_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.input.pathname}`,
                test.input.sha,
                Buffer.from(input.buffer).toString('base64')
            );
            await this.repository.update(test.id, {
                input: { pathname: test.input.pathname, sha: input_res.content.sha }
            });

            // output
            const output_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.output.pathname}`,
                test.output.sha,
                Buffer.from(output.buffer).toString('base64')
            );
            await this.repository.update(test.id, {
                output: { pathname: test.output.pathname, sha: output_res.content.sha }
            });

            this.logger.debug('[onTestUpdate] Test updated in Github repository');
        } catch (err) {
            this.logger.error(`[onTestUpdate] Test NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TEST_CMD_DELETE })
    public async onTestDelete(
        { user, test }: { user: UserEntity, test: TestEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestDelete] Delete test in Github repository`);
            const exercise = await this.exerciseService.findOne(test.exercise_id);
            let testset_path = '';
            if (test.testset_id) {
                testset_path = `testsets/${test.testset_id}/`;
            }
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}`
            );
            this.logger.debug('[onTestDelete] Test deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onTestDelete] Test NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TEST_INPUT_CMD_CREATE })
    public async onTestInputCreate(
        { user, test, content }: { user: UserEntity, test: TestEntity, content: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestInputCreate] Create test input in Github repository`);
            const exercise = await this.exerciseService.findOne(test.exercise_id);
            let testset_path = '';
            if (test.testset_id) {
                testset_path = `testsets/${test.testset_id}/`;
            }
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.input.pathname}`,
                Buffer.from(content.buffer).toString('base64')
            );
            await this.repository.update(test.id, {
                input: { pathname: test.input.pathname, sha: res.content.sha }
            });
            this.logger.debug('[onTestInputCreate] Test input created in Github repository');
        } catch (err) {
            this.logger.error(`[onTestInputCreate] Test input NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TEST_INPUT_CMD_UPDATE })
    public async onTestInputUpdate(
        { user, test, content }: { user: UserEntity, test: TestEntity, content: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestInputUpdate] Update test input in Github repository`);
            const exercise = await this.exerciseService.findOne(test.exercise_id);
            let testset_path = '';
            if (test.testset_id) {
                testset_path = `testsets/${test.testset_id}/`;
            }
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.input.pathname}`,
                test.input.sha,
                Buffer.from(content.buffer).toString('base64')
            );
            await this.repository.update(test.id, {
                input: { pathname: test.input.pathname, sha: res.content.sha }
            });
            this.logger.debug('[onTestInputUpdate] Test input updated in Github repository');
        } catch (err) {
            this.logger.error(`[onTestInputUpdate] Test input NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TEST_OUTPUT_CMD_CREATE })
    public async onTestOutputCreate(
        { user, test, content }: { user: UserEntity, test: TestEntity, content: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestOutputCreate] Create test output in Github repository`);
            const exercise = await this.exerciseService.findOne(test.exercise_id);
            let testset_path = '';
            if (test.testset_id) {
                testset_path = `testsets/${test.testset_id}/`;
            }
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.output.pathname}`,
                Buffer.from(content.buffer).toString('base64')
            );
            await this.repository.update(test.id, {
                output: { pathname: test.output.pathname, sha: res.content.sha }
            });
            this.logger.debug('[onTestOutputCreate] Test output created in Github repository');
        } catch (err) {
            this.logger.error(`[onTestOutputCreate] Test output NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TEST_OUTPUT_CMD_UPDATE })
    public async onTestOutputUpdate(
        { user, test, content }: { user: UserEntity, test: TestEntity, content: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestOutputUpdate] Update test output in Github repository`);
            const exercise = await this.exerciseService.findOne(test.exercise_id);
            let testset_path = '';
            if (test.testset_id) {
                testset_path = `testsets/${test.testset_id}/`;
            }
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/${testset_path}tests/${test.id}/${test.output.pathname}`,
                test.output.sha,
                Buffer.from(content.buffer).toString('base64')
            );
            await this.repository.update(test.id, {
                output: { pathname: test.output.pathname, sha: res.content.sha }
            });
            this.logger.debug('[onTestOutputUpdate] Test output updated in Github repository');
        } catch (err) {
            this.logger.error(`[onTestOutputUpdate] Test output NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }
}
