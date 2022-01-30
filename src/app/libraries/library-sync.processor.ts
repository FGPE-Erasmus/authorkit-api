import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GitService } from '../git/git.service';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    LIBRARY_SYNC_QUEUE,
    LIBRARY_SYNC_CREATE,
    LIBRARY_SYNC_UPDATE,
    LIBRARY_SYNC_DELETE,
    LIBRARY_SYNC_CREATE_FILE,
    LIBRARY_SYNC_UPDATE_FILE
} from './library.constants';
import { LibraryEntity } from './entity/library.entity';

@Processor(LIBRARY_SYNC_QUEUE)
export class LibrarySyncProcessor {
    private logger = new AppLogger(LibrarySyncProcessor.name);

    constructor(
        @InjectRepository(LibraryEntity)
        protected readonly repository: Repository<LibraryEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly gitService: GitService,
        protected readonly userService: UserService
    ) {}

    @Process(LIBRARY_SYNC_CREATE)
    public async onLibraryCreate(job: Job) {
        this.logger.debug(
            `[onLibraryCreate] Create library in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // library
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/libraries/${entity.id}/metadata.json`,
            Buffer.from(
                JSON.stringify({
                    id: entity.id,
                    pathname: entity.pathname,
                    type: 'LIBRARY'
                })
            ).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res });

        this.logger.debug(
            '[onLibraryCreate] Library created in Github repository'
        );
    }

    @Process(LIBRARY_SYNC_CREATE_FILE)
    public async onLibraryCreateFile(job: Job) {
        this.logger.debug(
            `[onLibraryCreateFile] Create library file in Github repository`
        );

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/libraries/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, {
            file: { sha: res }
        });

        this.logger.debug(
            '[onLibraryCreateFile] Library file created in Github repository'
        );
    }

    @Process(LIBRARY_SYNC_UPDATE)
    public async onLibraryUpdate(job: Job) {
        this.logger.debug(
            `[onLibraryUpdate] Update library in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // library
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/libraries/${entity.id}/metadata.json`,
            Buffer.from(
                JSON.stringify({
                    id: entity.id,
                    pathname: entity.pathname,
                    type: 'LIBRARY'
                })
            ).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res });

        this.logger.debug(
            '[onLibraryUpdate] Library updated in Github repository'
        );
    }

    @Process(LIBRARY_SYNC_UPDATE_FILE)
    public async onLibraryUpdateFile(job: Job) {
        this.logger.debug(
            `[onLibraryUpdateFile] Update library file in Github repository`
        );

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/libraries/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, {
            file: { sha: res }
        });

        this.logger.debug(
            '[onLibraryUpdateFile] Library file updated in Github repository'
        );
    }

    @Process(LIBRARY_SYNC_DELETE)
    public async onLibraryDelete(job: Job) {
        this.logger.debug(
            `[onLibraryDelete] Delete library in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.gitService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/libraries/${entity.id}`
        );

        this.logger.debug(
            '[onLibraryDelete] Library deleted in Github repository'
        );
    }
}
