import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../_helpers/decorators';
import { CrudRequest, ParsedRequest } from '@nestjsx/crud';
import { TemplateDto } from './dto/import.dto';
import { GamificationLayerService } from '../gamification-layers/gamification-layer.service';
import fetch from 'node-fetch';

@ApiTags('gamification-template')
@Controller('gamification-template')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class GamificationTemplateController {

    constructor(
        readonly gamificationService: GamificationLayerService
    ) { }

    @Get('/templates-list')
    async getAllTemplates() {
        return [{ 'id': '4exercises' }, { 'id': '2exercises' }];
    }

    @Post('/create-from-template')
    @ApiBody({ type: TemplateDto, required: true })
    async createTemplate(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @Body() dto: TemplateDto
    ) {
        const url = 'https://raw.githubusercontent.com/uniparthenope-fgpe/gamification-template/main/' + dto.template_id + '.zip';
        const obj = await (await fetch(url)).buffer();
        const data = {'buffer': obj};

        const exercises_map = {};
        const exercises = dto.exercise_ids;
        exercises.forEach((exercise, i) => {
            exercises_map['EX_' + ++i] = exercise['id'];
        });
        return await this.gamificationService.import(user, dto.project_id, data, exercises_map);
    }
}

