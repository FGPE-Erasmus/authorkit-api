import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../_helpers/decorators';
import { CrudRequest, ParsedRequest } from '@nestjsx/crud';
import { TemplateDto } from './dto/import.dto';
import { GamificationLayerService } from '../gamification-layers/gamification-layer.service';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/core';
import {Open} from 'unzipper';

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
        const octokit = new Octokit();

        // Read github 'zip' directory content
        const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner: 'uniparthenope-fgpe',
            repo: 'gamification-template',
            path: 'zip'
        });
        const info = [];
        const _data = response.data;

        // For each template file
        // tslint:disable-next-line:forin
        for (const idx in _data) {
            let count_ex = 0;
            let count_ch = 0;

            // Open zip file
            const obj = await (await fetch(_data[idx].download_url)).buffer();
            const directory = await Open.buffer(obj);

            const files = directory.files;
            for (const fdx in files) {
                // Count exercises
                if (files[fdx].type === 'File' && (files[fdx].path).includes('exercises/')) {
                    count_ex++;
                } else if (files[fdx].type === 'Directory' && (files[fdx].path).includes('challenges/')) {
                    const challenges_path = (files[fdx].path.replace('challenges/', '')).split('/');
                    if (challenges_path.length === 2) {
                        count_ch++;
                    }
                    console.log(challenges_path);
                    console.log(challenges_path.length);
                }
            }

            info.push({
                'id': (_data[idx].name).replace('.zip', ''),
                'tot_exercises': count_ex,
                'tot_challenges': count_ch
            });
        }
        return info;
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

