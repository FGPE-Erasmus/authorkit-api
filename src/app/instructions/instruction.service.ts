import { Injectable, InternalServerErrorException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import translate, { languages } from 'translation-google';

import { AppLogger } from '../app.logger';
import { TextFormat } from '../_helpers/entity/text-format.enum';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { ExerciseEntity } from '../exercises/entity';
import { ExerciseService } from '../exercises/exercise.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity';
import { InstructionEntity } from './entity/instruction.entity';
import {
    INSTRUCTION_SYNC_QUEUE,
    INSTRUCTION_SYNC_CREATE,
    INSTRUCTION_SYNC_UPDATE,
    INSTRUCTION_SYNC_DELETE,
    INSTRUCTION_SYNC_CREATE_FILE,
    INSTRUCTION_SYNC_UPDATE_FILE
} from './instruction.constants';


@Injectable()
export class InstructionService {

    private logger = new AppLogger(InstructionService.name);

    constructor(
        @InjectRepository(InstructionEntity)
        protected readonly repository: Repository<InstructionEntity>,

        @InjectQueue(INSTRUCTION_SYNC_QUEUE) private readonly instructionSyncQueue: Queue,

        protected readonly githubApiService: GithubApiService,

        @Inject(forwardRef(() => ExerciseService))
        protected readonly exerciseService: ExerciseService
    ) {
    }

    public async getContents(user: UserEntity, id: string):
            Promise<any> {
        const entity = await this.repository.findOneOrFail(id);
        const exercise = await this.exerciseService.findOne(entity.exercise_id);
        try {
            const response = await this.githubApiService.getFileContents(
                user,
                exercise.project_id,
                `exercises/${exercise.id}/instructions/${entity.id}/${entity.pathname}`
            );
            return response.content;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to read ${entity.pathname}`, e);
        }
    }

    public async getOne(user: UserEntity, id: string): Promise<InstructionEntity> {
        try {
            return await this.repository.findOneOrFail(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to get instruction`, e);
        }
    }

    public async createOne(user: UserEntity, dto: InstructionEntity, file: any):
            Promise<InstructionEntity> {
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(plainToClass(InstructionEntity, dto));
            this.instructionSyncQueue.add(INSTRUCTION_SYNC_CREATE, { user, entity });
            this.instructionSyncQueue.add(
                INSTRUCTION_SYNC_CREATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to create instruction`, e);
        }
    }

    public async updateOne(user: UserEntity, id: string, dto: InstructionEntity, file: any):
            Promise<InstructionEntity> {
        const instruction = await this.repository.findOneOrFail(id);
        delete dto.exercise_id;
        dto.pathname = file.originalname;
        try {
            const entity = await this.repository.save(
                plainToClass(InstructionEntity, { ...instruction, ...dto })
            );
            this.instructionSyncQueue.add(INSTRUCTION_SYNC_UPDATE, { user, entity });
            this.instructionSyncQueue.add(
                INSTRUCTION_SYNC_UPDATE_FILE,
                { user, entity, file },
                { delay: 1000 }
            );
            return entity;
        } catch (e) {
            throw new InternalServerErrorException(`Failed to update instruction`, e);
        }
    }

    public async deleteOne(user: UserEntity, id: string): Promise<InstructionEntity> {
        const entity = await this.repository.findOneOrFail(id);
        try {
            await this.repository.delete(id);
        } catch (e) {
            throw new InternalServerErrorException(`Failed to delete instruction`, e);
        }
        this.instructionSyncQueue.add(INSTRUCTION_SYNC_DELETE, { user, entity });
        return entity;
    }

    public async importProcessEntries(
        user: UserEntity, exercise: ExerciseEntity, entries: any
    ): Promise<void> {

        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            throw new BadRequestException('Archive misses required metadata');
        }

        const entity = await this.importMetadataFile(user, exercise, root_metadata);

        if (!entries[entity.pathname]) {
            throw new BadRequestException('Archive misses referenced file');
        }

        this.instructionSyncQueue.add(
            INSTRUCTION_SYNC_CREATE_FILE,
            {
                user, entity, file: { buffer: (await entries[entity.pathname].buffer()) }
            },
            { delay: 1000 }
        );
    }

    public async importMetadataFile(
        user: UserEntity, exercise: ExerciseEntity, metadataFile: any
    ): Promise<InstructionEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: InstructionEntity = await this.repository.save({
            format: metadata.format,
            nat_lang: metadata.nat_lang,
            pathname: metadata.pathname,
            exercise_id: exercise.id
        });

        this.instructionSyncQueue.add(
            INSTRUCTION_SYNC_CREATE, { user, entity }
        );

        return entity;
    }

    public async translate(
        user: UserEntity, id: string, nat_lang: string
    ): Promise<InstructionEntity> {
        const instruction = await this.getOne(user, id);
        if (instruction.format !== TextFormat.TXT
            && instruction.format !== TextFormat.HTML
            && instruction.format !== TextFormat.MARKDOWN
        ) {
            throw new BadRequestException(`Cannot translate instructions in ${instruction.format}`);
        }
        let contents = Buffer.from(await this.getContents(user, id), 'base64').toString('utf8');
        if (instruction.nat_lang !== nat_lang
            && languages[nat_lang]
            && languages[instruction.nat_lang]) {
            const translated = await translate(contents, {from: instruction.nat_lang, to: nat_lang});
            contents = translated.text;
        }
        return this.createOne(user, {
            exercise_id: instruction.exercise_id,
            format: instruction.format,
            nat_lang
        } as InstructionEntity, {
            originalname: nat_lang + '_' + (
                instruction.pathname.startsWith(`${instruction.nat_lang}_`) ?
                instruction.pathname.substr(instruction.nat_lang.length + 1) :
                instruction.pathname),
            buffer: Buffer.from(contents)
        });
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'instruction', prop: 'instructions' }
            ],
            `instruction.id = '${id}'`,
            `permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
