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
    LIBRARY_CMD_CREATE,
    LIBRARY_CMD_UPDATE,
    LIBRARY_CMD_DELETE
} from './library.constants';
import { LibraryEntity } from './entity/library.entity';

@Controller()
export class LibraryListener {

    private logger = new AppLogger(LibraryListener.name);

    constructor(
        @InjectRepository(LibraryEntity)
        protected readonly repository: Repository<LibraryEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: LIBRARY_CMD_CREATE })
    public async onLibraryCreate(
        { user, library, contents }: { user: UserEntity, library: LibraryEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onLibraryCreate] Create library in Github repository`);
            const exercise = await this.exerciseService.findOne(library.exercise_id);

            // library
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/libraries/${library.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: library.id,
                    pathname: library.pathname,
                    type: 'LIBRARY'
                })).toString('base64')
            );
            await this.repository.update(library.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/libraries/${library.id}/${library.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(library.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onLibraryCreate] Library created in Github repository');
        } catch (err) {
            this.logger.error(`[onLibraryCreate] Library NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: LIBRARY_CMD_UPDATE })
    public async onLibraryUpdate(
        { user, library, contents }: { user: UserEntity, library: LibraryEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onLibraryUpdate] Update library in Github repository`);
            const exercise = await this.exerciseService.findOne(library.exercise_id);

            // library
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/libraries/${library.id}/metadata.json`,
                library.sha,
                Buffer.from(JSON.stringify({
                    id: library.id,
                    pathname: library.pathname,
                    type: 'LIBRARY'
                })).toString('base64')
            );
            await this.repository.update(library.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/libraries/${library.id}/${library.pathname}`,
                library.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(library.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onLibraryUpdate] Library updated in Github repository');
        } catch (err) {
            this.logger.error(`[onLibraryUpdate] Library NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: LIBRARY_CMD_DELETE })
    public async onLibraryDelete(
        { user, library }: { user: UserEntity, library: LibraryEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onLibraryDelete] Delete library in Github repository`);
            const exercise = await this.exerciseService.findOne(library.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/libraries/${library.id}`
            );
            this.logger.debug('[onLibraryDelete] Library deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onLibraryDelete] Library NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
