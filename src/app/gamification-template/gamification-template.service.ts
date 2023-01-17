import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GamificationLayerService } from '../gamification-layers/gamification-layer.service';
import { ImportDto, TemplateDto, UploadDto } from './dto/import.dto';

import { UserEntity } from '../user/entity';
import { GithubApiService } from '../github-api/github-api.service';
import { Open } from 'unzipper';
import { config } from '../../config';
import { Buffer } from 'buffer';
import * as fs from 'fs';

@Injectable()
export class GamificationTemplateService {

    constructor(
        readonly githubService: GithubApiService,
        readonly gamificationService: GamificationLayerService
    ) {}

    public async getExercises(user: UserEntity): Promise<any> {
        try {
            const exists = await this.githubService.getTemplateRepository(config.githubApi.template_repo);
            if (exists) {
                // Read github 'zip' directory content
                const response = await this.githubService.getFileContents(user, config.githubApi.template_repo, '');
                const info = {};

                // For each template file
                // tslint:disable-next-line:forin
                for (const idx in response) {
                    let count_ex = 0;
                    let count_ch = 0;

                    // Get files list
                    const obj = await this.githubService.getFileContents(user, config.githubApi.template_repo, response[idx].path);
                    const content = Buffer.from(obj.content, 'base64');
                    const directory = await Open.buffer(content);

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
            } else {
                return [];
            }
        } catch (err) {
            throw new InternalServerErrorException('Failed getting templates list');
        }
    }

    public async create(user: UserEntity, dto: TemplateDto): Promise<any> {
        try {
            const exercises_map = {};
            const exercises = dto.exercise_ids;
            const exercises_template = await this.getExercises(user);
            if (exercises_template[dto.template_id].tot_exercises !== exercises.length) {
                throw new InternalServerErrorException('Wrong exercises number!');
            } else {
                const path = `${dto.template_id}.zip`;
                const response = await this.githubService.getFileContents(user, config.githubApi.template_repo, path);
                const content = Buffer.from(response.content, 'base64');
                const data = {'buffer': content};

                exercises.forEach((exercise, i) => {
                    exercises_map['EX_' + ++i] = exercise['id'];
                });

                return await this.gamificationService.import(user, dto.project_id, data, exercises_map);
            }
        } catch (err) {
            throw new InternalServerErrorException('Error creating gamification layer');
        }
    }

    public async upload(user: UserEntity, dto: UploadDto): Promise<any> {
        try {
            const repoPath = `${dto.gl_name}.zip`;
            const path = `${__dirname}/${dto.gl_name}.zip`;
            const output = fs.createWriteStream(path);

            await this.gamificationService.export(user, dto.gl_id, 'template', 'zip', output);
            output.end();
            output.close();

            const finishWriting = new Promise<void>(resolve => {
                output.on('finish', function() {
                    resolve();
                });
            });
            await Promise.all([finishWriting]);

            const content = fs.readFileSync(path);

            return this.uploadTemplate(user, repoPath, content);
        } catch (err) {
            console.log(err);
            throw new InternalServerErrorException('Upload template failed');
        }
    }

    public async uploadTemplate(user: UserEntity, repoPath: string, content: any): Promise<any> {
        const contentEncoded = Buffer.from(content).toString('base64');

        const exists = await this.githubService.getTemplateRepository(config.githubApi.template_repo);
        if (!exists) {
            await this.githubService.createTemplateRepository(config.githubApi.template_repo);
        }

        return await this.githubService.createFile(user, config.githubApi.template_repo, repoPath, contentEncoded);
    }

    public async import(user: UserEntity, dto: ImportDto, input: any): Promise<any> {
        const repoPath = `${dto.gl_name}.zip`;
        const content = input.buffer;
        return this.uploadTemplate(user, repoPath, content);
    }
}





