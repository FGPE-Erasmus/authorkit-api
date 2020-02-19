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
    TEST_GENERATOR_CMD_CREATE,
    TEST_GENERATOR_CMD_UPDATE,
    TEST_GENERATOR_CMD_DELETE
} from './test-generator.constants';
import { TestGeneratorEntity } from './entity/test-generator.entity';

@Controller()
export class TestGeneratorListener {

    private logger = new AppLogger(TestGeneratorListener.name);

    constructor(
        @InjectRepository(TestGeneratorEntity)
        protected readonly repository: Repository<TestGeneratorEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: TEST_GENERATOR_CMD_CREATE })
    public async onTestGeneratorCreate(
        { user, test_generator, contents }: { user: UserEntity, test_generator: TestGeneratorEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestGeneratorCreate] Create test generator in Github repository`);
            const exercise = await this.exerciseService.findOne(test_generator.exercise_id);

            // test generator
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/test-generators/${test_generator.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: test_generator.id,
                    pathname: test_generator.pathname,
                    command_line: test_generator.command_line
                })).toString('base64')
            );
            await this.repository.update(test_generator.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/test-generators/${test_generator.id}/${test_generator.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(test_generator.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onTestGeneratorCreate] Test generator created in Github repository');
        } catch (err) {
            this.logger.error(`[onTestGeneratorCreate] Test generator NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TEST_GENERATOR_CMD_UPDATE })
    public async onTestGeneratorUpdate(
        { user, test_generator, contents }: { user: UserEntity, test_generator: TestGeneratorEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestGeneratorUpdate] Update test generator in Github repository`);
            const exercise = await this.exerciseService.findOne(test_generator.exercise_id);

            // test generator
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/test-generators/${test_generator.id}/metadata.json`,
                test_generator.sha,
                Buffer.from(JSON.stringify({
                    id: test_generator.id,
                    pathname: test_generator.pathname,
                    command_line: test_generator.command_line
                })).toString('base64')
            );
            await this.repository.update(test_generator.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/test-generators/${test_generator.id}/${test_generator.pathname}`,
                test_generator.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(test_generator.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onTestGeneratorUpdate] Test generator updated in Github repository');
        } catch (err) {
            this.logger.error(`[onTestGeneratorUpdate] Test generator NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: TEST_GENERATOR_CMD_DELETE })
    public async onTestGeneratorDelete(
        { user, test_generator }: { user: UserEntity, test_generator: TestGeneratorEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onTestGeneratorDelete] Delete test generator in Github repository`);
            const exercise = await this.exerciseService.findOne(test_generator.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/test_generators/${test_generator.id}`
            );
            this.logger.debug('[onTestGeneratorDelete] Test generator deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onTestGeneratorDelete] Test generator NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
