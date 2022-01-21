import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../_helpers/decorators';
import { CrudRequest, ParsedRequest } from '@nestjsx/crud';
import { TemplateDto } from './dto/import.dto';
import { GamificationTemplateService } from './gamification-template.service';
import { UserEntity } from '../user/entity';

@ApiTags('gamification-template')
@Controller('gamification-template')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class GamificationTemplateController {

    constructor(
        readonly gamificationTemplate: GamificationTemplateService
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
        @ParsedRequest() parsedReq: CrudRequest,
        @Body() dto: TemplateDto
    ) {
        return await this.gamificationTemplate.createGamificationLayerFromTemplate(user, dto);
    }
}

