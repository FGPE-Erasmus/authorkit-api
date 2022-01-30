import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GitService } from '../git/git.service';
import { UserService } from '../user/user.service';
import { ExerciseService } from '../exercises/exercise.service';

import {
    INSTRUCTION_SYNC_QUEUE,
    INSTRUCTION_SYNC_CREATE,
    INSTRUCTION_SYNC_UPDATE,
    INSTRUCTION_SYNC_DELETE,
    INSTRUCTION_SYNC_CREATE_FILE,
    INSTRUCTION_SYNC_UPDATE_FILE
} from './instruction.constants';
import { InstructionEntity } from './entity/instruction.entity';

@Processor(INSTRUCTION_SYNC_QUEUE)
export class InstructionSyncProcessor {
    private logger = new AppLogger(InstructionSyncProcessor.name);

    constructor(
        @InjectRepository(InstructionEntity)
        protected readonly repository: Repository<InstructionEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly gitService: GitService,
        protected readonly userService: UserService
    ) {}

    @Process(INSTRUCTION_SYNC_CREATE)
    public async onInstructionCreate(job: Job) {
        this.logger.debug(
            `[onInstructionCreate] Create instruction in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // instruction
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/instructions/${entity.id}/metadata.json`,
            Buffer.from(
                JSON.stringify({
                    id: entity.id,
                    pathname: entity.pathname,
                    nat_lang: entity.nat_lang,
                    format: entity.format?.toUpperCase()
                })
            ).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res });

        this.logger.debug(
            '[onInstructionCreate] Instruction created in Github repository'
        );
    }

    @Process(INSTRUCTION_SYNC_CREATE_FILE)
    public async onInstructionCreateFile(job: Job) {
        this.logger.debug(
            `[onInstructionCreateFile] Create instruction file in Github repository`
        );

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const res = await this.gitService.createFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/instructions/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, {
            file: { sha: res }
        });

        this.logger.debug(
            '[onInstructionCreateFile] Instruction file created in Github repository'
        );
    }

    @Process(INSTRUCTION_SYNC_UPDATE)
    public async onInstructionUpdate(job: Job) {
        this.logger.debug(
            `[onInstructionUpdate] Update instruction in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // instruction
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/instructions/${entity.id}/metadata.json`,
            Buffer.from(
                JSON.stringify({
                    id: entity.id,
                    pathname: entity.pathname,
                    nat_lang: entity.nat_lang,
                    format: entity.format?.toUpperCase()
                })
            ).toString('base64')
        );
        await this.repository.update(entity.id, { sha: res });

        this.logger.debug(
            '[onInstructionUpdate] Instruction updated in Github repository'
        );
    }

    @Process(INSTRUCTION_SYNC_UPDATE_FILE)
    public async onInstructionUpdateFile(job: Job) {
        this.logger.debug(
            `[onInstructionUpdateFile] Update instruction file in Github repository`
        );

        const { user, entity, file } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);

        // file
        const res = await this.gitService.updateFile(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/instructions/${entity.id}/${entity.pathname}`,
            Buffer.from(file.buffer).toString('base64')
        );
        await this.repository.update(entity.id, {
            file: { sha: res }
        });

        this.logger.debug(
            '[onInstructionUpdateFile] Instruction file updated in Github repository'
        );
    }

    @Process(INSTRUCTION_SYNC_DELETE)
    public async onInstructionDelete(job: Job) {
        this.logger.debug(
            `[onInstructionDelete] Delete instruction in Github repository`
        );

        const { user, entity } = job.data;

        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        await this.gitService.deleteFolder(
            user,
            exercise.project_id,
            `exercises/${exercise.id}/instructions/${entity.id}`
        );

        this.logger.debug(
            '[onInstructionDelete] Instruction deleted in Github repository'
        );
    }
}
