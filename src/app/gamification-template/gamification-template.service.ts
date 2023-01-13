import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GamificationLayerService } from '../gamification-layers/gamification-layer.service';
import { TemplateDto } from './dto/import.dto';

import fetch from 'node-fetch';
import { UserEntity } from '../user/entity';
import { GithubApiService } from '../github-api/github-api.service';
import { Open } from 'unzipper';
import { config } from '../../config';

@Injectable()
export class GamificationTemplateService {

    constructor(
        readonly githubService: GithubApiService,
        readonly gamificationService: GamificationLayerService
    ) {}

    public async getExercisesFromTemplateGithub(user: UserEntity): Promise<any> {
        // Read github 'zip' directory content
        const response = await this.githubService.getFileContents(user, config.githubApi.template_repo, config.githubApi.template_path);
        const info = {};

        // For each template file
        // tslint:disable-next-line:forin
        for (const idx in response) {
            let count_ex = 0;
            let count_ch = 0;

            // Open zip file
            const obj = await (await fetch(response[idx].download_url)).buffer();
            const directory = await Open.buffer(obj);

            const files = directory.files;
            for (const fdx in files) {
                // Count exercises and challenges
                if (files[fdx].type === 'File') {
                    if (files[fdx].path.startsWith('exercises/')) {
                        count_ex++;
                    } else if (files[fdx].path.startsWith('challenges/')) {
                        const challenges_path = (files[fdx].path.replace('challenges/', '')).split('/');
                        if (challenges_path.length === 2) {
                            count_ch++;
                        }
                    }
                }
            }

            info[(response[idx].name).replace('.zip', '')] = {
                'id': (response[idx].name).replace('.zip', ''),
                'label': (response[idx].name).replace('.zip', ''),
                'tot_exercises': count_ex,
                'tot_challenges': count_ch
            };
        }

        return info;
    }

    public async createGamificationLayerFromTemplate(user: UserEntity, dto: TemplateDto): Promise<any> {
        const exercises_map = {};
        const exercises = dto.exercise_ids;
        const exercises_template = await this.getExercisesFromTemplateGithub(user);
        if (exercises_template[dto.template_id].tot_exercises !== exercises.length) {
            throw new InternalServerErrorException('Wrong exercises number!');
        } else {
            const response = await this.githubService.getFileContents(user, config.githubApi.template_repo, config.githubApi.template_path);
            for (const idx in response) {
                if (response[idx].name === dto.template_id + '.zip') {
                    const url = response[idx].download_url;
                    const obj = await (await fetch(url)).buffer();
                    const data = {'buffer': obj};

                    exercises.forEach((exercise, i) => {
                        exercises_map['EX_' + ++i] = exercise['id'];
                    });

                    return await this.gamificationService.import(user, dto.project_id, data, exercises_map);
                }
            }
        }
    }
}

