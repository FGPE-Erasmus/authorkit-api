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
    INSTRUCTION_CMD_CREATE,
    INSTRUCTION_CMD_UPDATE,
    INSTRUCTION_CMD_DELETE
} from './instruction.constants';
import { InstructionEntity } from './entity/instruction.entity';

@Controller()
export class InstructionListener {

    private logger = new AppLogger(InstructionListener.name);

    constructor(
        @InjectRepository(InstructionEntity)
        protected readonly repository: Repository<InstructionEntity>,
        protected readonly exerciseService: ExerciseService,
        protected readonly githubApiService: GithubApiService,
        protected readonly userService: UserService
    ) { }

    @MessagePattern({ cmd: INSTRUCTION_CMD_CREATE })
    public async onInstructionCreate(
        { user, instruction, contents }: { user: UserEntity, instruction: InstructionEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onInstructionCreate] Create instruction in Github repository`);
            const exercise = await this.exerciseService.findOne(instruction.exercise_id);

            // instruction
            const res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/instructions/${instruction.id}/metadata.json`,
                Buffer.from(JSON.stringify({
                    id: instruction.id,
                    pathname: instruction.pathname,
                    nat_lang: instruction.nat_lang,
                    format: instruction.format
                })).toString('base64')
            );
            await this.repository.update(instruction.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.createFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/instructions/${instruction.id}/${instruction.pathname}`,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(instruction.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onInstructionCreate] Instruction created in Github repository');
        } catch (err) {
            this.logger.error(`[onInstructionCreate] Instruction NOT created in Github repository,\
                 because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: INSTRUCTION_CMD_UPDATE })
    public async onInstructionUpdate(
        { user, instruction, contents }: { user: UserEntity, instruction: InstructionEntity, contents: any }
    ): Promise<void> {
        try {
            this.logger.debug(`[onInstructionUpdate] Update instruction in Github repository`);
            const exercise = await this.exerciseService.findOne(instruction.exercise_id);

            // instruction
            const res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/instructions/${instruction.id}/metadata.json`,
                instruction.sha,
                Buffer.from(JSON.stringify({
                    id: instruction.id,
                    pathname: instruction.pathname,
                    nat_lang: instruction.nat_lang,
                    format: instruction.format
                })).toString('base64')
            );
            await this.repository.update(instruction.id, { sha: res.content.sha });

            // file
            const file_res = await this.githubApiService.updateFile(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/instructions/${instruction.id}/${instruction.pathname}`,
                instruction.file.sha,
                Buffer.from(contents.buffer).toString('base64')
            );
            await this.repository.update(instruction.id, { file: { sha: file_res.content.sha } });

            this.logger.debug('[onInstructionUpdate] Instruction updated in Github repository');
        } catch (err) {
            this.logger.error(`[onInstructionUpdate] Instruction NOT updated in Github repository,\
                because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: INSTRUCTION_CMD_DELETE })
    public async onInstructionDelete(
        { user, instruction }: { user: UserEntity, instruction: InstructionEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onInstructionDelete] Delete instruction in Github repository`);
            const exercise = await this.exerciseService.findOne(instruction.exercise_id);
            await this.githubApiService.deleteFolder(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/instructions/${instruction.id}`
            );
            this.logger.debug('[onInstructionDelete] Instruction deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onInstructionDelete] Instruction NOT deleted in Github reposi\
                tory, because ${err.message}`, err.stack);
        }
    }
}
