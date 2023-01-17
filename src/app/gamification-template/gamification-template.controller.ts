import {
    BadRequestException,
    Body,
    Controller,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req, UploadedFile,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiFile, User } from '../_helpers/decorators';
import { ImportDto, TemplateDto, UploadDto } from './dto/import.dto';
import { GamificationTemplateService } from './gamification-template.service';
import { UserEntity } from '../user/entity';
import { AccessLevel } from '../permissions/entity';
import { GamificationLayerService } from '../gamification-layers/gamification-layer.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('gamification-template')
@Controller('gamification-template')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class GamificationTemplateController {

    constructor(
        readonly gamificationTemplate: GamificationTemplateService,
        readonly service: GamificationLayerService
    ) { }

    @Get('/templates-list')
    async getAllTemplates(
        @User() user: UserEntity
    ) {
        return await this.gamificationTemplate.getExercises(user);
    }

    @Post('/create-from-template')
    @ApiBody({ type: TemplateDto, required: true })
    async createTemplate(
        @User() user: UserEntity,
        @Body() dto: TemplateDto
    ) {
        return await this.gamificationTemplate.create(user, dto);
    }

    @Post('/upload')
    @ApiBody({ type: UploadDto, required: true })
    async uploadTemplate(
        @User() user: UserEntity,
        @Body() dto: UploadDto
    ) {
        if (!dto || !dto.gl_id) {
            throw new BadRequestException('The id of the gamification layer must be specified');
        }
        const accessLevel = await this.service.getAccessLevel(dto.gl_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return await this.gamificationTemplate.upload(user, dto);
    }

    @Post('/import')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiFile({ name: 'file', required: true })
    @ApiBody({ type: ImportDto, required: true })
    async import(
        @User() user: any,
        @UploadedFile() file,
        @Body() dto: ImportDto
    ) {
        if (!dto || !dto.gl_name) {
            throw new BadRequestException('The name of the template must be specified');
        }
        return this.gamificationTemplate.import(user, dto, file);
    }
}



