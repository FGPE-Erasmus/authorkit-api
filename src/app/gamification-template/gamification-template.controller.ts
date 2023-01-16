import { BadRequestException, Body, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../_helpers/decorators';
import { CrudRequest, ParsedRequest } from '@nestjsx/crud';
import { TemplateDto, UploadDto } from './dto/import.dto';
import { GamificationTemplateService } from './gamification-template.service';
import { UserEntity } from '../user/entity';
import { AccessLevel } from '../permissions/entity';
import { GamificationLayerService } from '../gamification-layers/gamification-layer.service';

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
        return await this.gamificationTemplate.getExercisesFromTemplateGithub(user);
    }

    @Post('/create-from-template')
    @ApiBody({ type: TemplateDto, required: true })
    async createTemplate(
        @User() user: UserEntity,
        @Body() dto: TemplateDto
    ) {
        return await this.gamificationTemplate.createGamificationLayerFromTemplate(user, dto);
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
        return await this.gamificationTemplate.uploadGamificationLayerTemplate(user, dto);
    }
}


