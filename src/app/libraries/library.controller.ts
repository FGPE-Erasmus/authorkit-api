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
    Get
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

import { ApiFile } from '../_helpers/decorators/api-file.decorator';
import { User } from '../_helpers/decorators/user.decorator';
import { ExerciseService } from '../exercises/exercise.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';

import { LibraryEntity } from './entity/library.entity';
import { LibraryService } from './library.service';


@Controller('libraries')
@ApiTags('libraries')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class LibraryController {

    constructor(
        protected readonly service: LibraryService,
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
    ): Promise<LibraryEntity> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.service.getOne(user, id);
    }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiFile({ name: 'file', required: true })
    @ApiBody({ type: LibraryEntity })
    async create(
        @User() user: any,
        @UploadedFile() file,
        @Body() dto: LibraryEntity
    ): Promise<LibraryEntity> {
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
    @ApiFile({ name: 'file', required: true })
    @ApiBody({ type: LibraryEntity })
    async update(
        @User() user: any,
        @Param('id') id: string,
        @UploadedFile() file,
        @Body() dto: LibraryEntity
    ): Promise<LibraryEntity> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return await this.service.updateOne(user, id, dto, file);
    }

    @Delete('/:id')
    async delete(@User() user: any, @Param('id') id: string): Promise<LibraryEntity> {
        const accessLevel = await this.service.getAccessLevel(id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return await this.service.deleteOne(user, id);
    }
}
