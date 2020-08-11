import {
    Controller,
    UseGuards,
    ClassSerializerInterceptor,
    UseInterceptors,
    Post,
    Delete,
    Param,
    ForbiddenException,
    UploadedFile,
    Body,
    Patch,
    Get,
    Query
} from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth, ApiConsumes, ApiImplicitBody, ApiImplicitFile } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

import { User } from '../_helpers/decorators/user.decorator';
import { ExerciseService } from '../exercises/exercise.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';

import { InstructionEntity } from './entity/instruction.entity';
import { InstructionService } from './instruction.service';


@Controller('instructions')
@ApiUseTags('instructions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class InstructionController {

    constructor(
        protected readonly service: InstructionService,
        protected readonly exerciseService: ExerciseService
    ) {}

    @Get('/:id/contents')
    async read(
        @User() user: any,
        @Param('id') id: string
    ): Promise<string> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.service.getContents(user, id);
    }

    @Get('/:id')
    async get(
        @User() user: any,
        @Param('id') id: string
    ): Promise<InstructionEntity> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.service.getOne(user, id);
    }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'instruction', type: InstructionEntity })
    async create(
        @User() user: any,
        @UploadedFile() file,
        @Body() dto: InstructionEntity
    ): Promise<InstructionEntity> {
        const accessLevel = await this.exerciseService.getAccessLevel(dto.exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return await this.service.createOne(user, dto, file);
    }

    @Patch('/:id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'instruction', type: InstructionEntity })
    async update(
        @User() user: any,
        @Param('id') id: string,
        @UploadedFile() file,
        @Body() dto: InstructionEntity
    ): Promise<InstructionEntity> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return await this.service.updateOne(user, id, dto, file);
    }

    @Delete('/:id')
    async delete(@User() user: any, @Param('id') id: string): Promise<InstructionEntity> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return await this.service.deleteOne(user, id);
    }

    @Post('/:id/translate')
    async translate(
        @User() user: any,
        @Param('id') id: string,
        @Query('nat_lang') nat_lang: string
    ): Promise<InstructionEntity> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.service.translate(user, id, nat_lang);
    }
}
