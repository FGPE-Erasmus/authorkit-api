import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GitService } from '../git/git.service';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    TEST_GENERATOR_SYNC_QUEUE,
    TEST_GENERATOR_SYNC_CREATE,
    TEST_GENERATOR_SYNC_UPDATE,
    TEST_GENERATOR_SYNC_DELETE,
    TEST_GENERATOR_SYNC_CREATE_FILE,
    TEST_GENERATOR_SYNC_UPDATE_FILE
} from './test-generator.constants';
import { TestGeneratorEntity } from './entity/test-generator.entity';

@Processor(TEST_GENERATOR_SYNC_QUEUE)
export class TestGeneratorSyncProcessor {
    private logger = new AppLogger(TestGeneratorSyncProcessor.name);

    constructor(
        @InjectRepository(TestGeneratorEntity)
        protected readonly repository: Repository<TestGeneratorEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly gitService: GitService,
        protected readonly userService: UserService
    ) {}

    @Process(TEST_GENERATOR_SYNC_CREATE)
    public async onTestGeneratorCreate(job: Job) {
        this.logger.debug(
            `[onTestGeneratorCreate] Create test generator in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // test generator
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/test-generators/${entity.id}/metadata.json`,
            Buffer.from(
                JSON.stringify({
                    id: entity.id,
                    pathname: entity.pathname,
                    command_line: entity.command_line
                })
            ).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res });

        this.logger.debug(
            '[onTestGeneratorCreate] Test generator created in Github repository'
        );
    }

    @Process(TEST_GENERATOR_SYNC_CREATE_FILE)
    public async onTestGeneratorCreateFile(job: Job) {
        this.logger.debug(
            `[onTestGeneratorCreateFile] Create test generator file in Github repository`
        );

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/test-generators/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, {
            file: { sha: res }
        });

        this.logger.debug(
            '[onTestGeneratorCreateFile] Test generator file created in Github repository'
        );
    }

    @Process(TEST_GENERATOR_SYNC_UPDATE)
    public async onTestGeneratorUpdate(job: Job) {
        this.logger.debug(
            `[onTestGeneratorUpdate] Update test generator in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // test generator
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/test-generators/${entity.id}/metadata.json`,
            Buffer.from(
                JSON.stringify({
                    id: entity.id,
                    pathname: entity.pathname,
                    command_line: entity.command_line
                })
            ).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res });

        this.logger.debug(
            '[onTestGeneratorUpdate] Test generator updated in Github repository'
        );
    }

    @Process(TEST_GENERATOR_SYNC_UPDATE_FILE)
    public async onTestGeneratorUpdateFile(job: Job) {
        this.logger.debug(
            `[onTestGeneratorUpdateFile] Update test generator file in Github repository`
        );

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/test-generators/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, {
            file: { sha: res }
        });

        this.logger.debug(
            '[onTestGeneratorUpdateFile] Test generator file updated in Github repository'
        );
    }

    @Process(TEST_GENERATOR_SYNC_DELETE)
    public async onTestGeneratorDelete(job: Job) {
        this.logger.debug(
            `[onTestGeneratorDelete] Delete test generator in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.gitService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/test-generators/${entity.id}`
        );

        this.logger.debug(
            '[onTestGeneratorDelete] Test generator deleted in Github repository'
        );
    }
}
