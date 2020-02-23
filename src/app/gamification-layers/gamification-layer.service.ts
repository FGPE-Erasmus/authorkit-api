import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Archiver, create } from 'archiver';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity/user.entity';
import { GamificationLayerEntity } from './entity/gamification-layer.entity';

@Injectable()
export class GamificationLayerService extends TypeOrmCrudService<GamificationLayerEntity> {

    private logger = new AppLogger(GamificationLayerService.name);

    constructor(
        @InjectRepository(GamificationLayerEntity)
        protected readonly repository: Repository<GamificationLayerEntity>,

        protected readonly githubApiService: GithubApiService
    ) {
        super(repository);
    }

    public async getOne(req: CrudRequest): Promise<GamificationLayerEntity> {
        return await super.getOne(req);
    }

    public async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<GamificationLayerEntity> | GamificationLayerEntity[]> {
        return await super.getMany(req);
    }

    public async createOne(req: CrudRequest, dto: GamificationLayerEntity): Promise<GamificationLayerEntity> {
        return super.createOne(req, dto);
    }

    public async updateOne(req: CrudRequest, dto: GamificationLayerEntity): Promise<GamificationLayerEntity> {
        return super.updateOne(req, dto);
    }

    public async replaceOne(req: CrudRequest, dto: GamificationLayerEntity): Promise<GamificationLayerEntity> {
        return super.updateOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<GamificationLayerEntity | void> {
        return super.deleteOne(req);
    }

    public async export(
        user: UserEntity, gamification_layer_id: string, format: string = 'zip', res: any
    ): Promise<void> {

        const archive: Archiver = create(format);

        archive.pipe(res);

        archive.on('error', function(err) {
            throw err;
        });

        const asyncArchiveWriters = [];

        await this.collectAllToExport(user, gamification_layer_id, archive, asyncArchiveWriters, '');

        await Promise.all(asyncArchiveWriters);

        await archive.finalize();
    }

    public async collectAllToExport(
        user: UserEntity, gamification_layer_id: string, archive: Archiver, asyncArchiveWriters: any[], archive_base_path: string
    ): Promise<void> {

        const gamification_layer: GamificationLayerEntity =
            await this.findOne(gamification_layer_id, {
                relations: ['challenges', 'leaderboards', 'rewards', 'rules']
            });

        const base_path = `gamification-layers/${gamification_layer_id}/`;

        asyncArchiveWriters.push(
            this.addFileFromGithubToArchive(
                user, gamification_layer, archive, `${base_path}metadata.json`, `${archive_base_path}metadata.json`
            )
        );

        for (const challenge of gamification_layer.challenges) {
            const challenge_path = `challenges/${challenge.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, gamification_layer, archive, `${base_path}${challenge_path}metadata.json`, `${archive_base_path}${challenge_path}metadata.json`
                )
            );
        }

        for (const leaderboard of gamification_layer.leaderboards) {
            let leaderboard_path = '';
            if (leaderboard.challenge_id) {
                leaderboard_path += `challenges/${leaderboard.challenge_id}/`;
            }
            leaderboard_path += `leaderboards/${leaderboard.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, gamification_layer, archive, `${base_path}${leaderboard_path}metadata.json`, `${archive_base_path}${leaderboard_path}metadata.json`
                )
            );
        }

        for (const reward of gamification_layer.rewards) {
            let reward_path = '';
            if (reward.challenge_id) {
                reward_path += `challenges/${reward.challenge_id}/`;
            }
            reward_path += `rewards/${reward.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, gamification_layer, archive, `${base_path}${reward_path}metadata.json`, `${archive_base_path}${reward_path}metadata.json`
                )
            );
        }

        for (const rule of gamification_layer.rules) {
            let rule_path = '';
            if (rule.challenge_id) {
                rule_path += `challenges/${rule.challenge_id}/`;
            }
            rule_path += `rules/${rule.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, gamification_layer, archive, `${base_path}${rule_path}metadata.json`, `${archive_base_path}${rule_path}metadata.json`
                )
            );
        }

    }

    public async getAccessLevel(gl_id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'gl', prop: 'gamification_layers' }
            ],
            `gl.id = '${gl_id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }

    /* Private Methods */

    private async addFileFromGithubToArchive(
        user: UserEntity, gamification_layer: GamificationLayerEntity, archive: Archiver, path: string, archive_path: string
    ): Promise<void> {

        const fileContents = await this.githubApiService.getFileContents(
            user, gamification_layer.project_id, path
        );
        archive.append(
            Buffer.from(fileContents.content, 'base64'),
            { name: archive_path }
        );
    }
}
