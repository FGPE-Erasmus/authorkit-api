import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import * as stream from 'stream';

import { Open } from 'unzipper';
import { Archiver, create } from 'archiver';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { DeepPartial } from '../_helpers/database/deep-partial';
import { GithubApiService } from '../github-api/github-api.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { UserEntity } from '../user/entity/user.entity';

import { GamificationLayerEntity } from './entity/gamification-layer.entity';
import { GAMIFICATION_LAYER_SYNC_CREATE, GAMIFICATION_LAYER_SYNC_QUEUE } from './gamification-layer.constants';
import { ChallengeService } from './challenges/challenge.service';
import { LeaderboardService } from './leaderboards/leaderboard.service';
import { RewardService } from './rewards/reward.service';
import { RuleService } from './rules/rule.service';
import { ExerciseService } from '../exercises/exercise.service';

@Injectable()
export class GamificationLayerService extends TypeOrmCrudService<GamificationLayerEntity> {

    private logger = new AppLogger(GamificationLayerService.name);

    constructor(
        @InjectRepository(GamificationLayerEntity)
        protected readonly repository: Repository<GamificationLayerEntity>,
        @InjectQueue(GAMIFICATION_LAYER_SYNC_QUEUE)
        private readonly gamificationLayerSyncQueue: Queue,
        protected readonly githubApiService: GithubApiService,
        @Inject(forwardRef(() => ChallengeService))
        protected readonly challengeService: ChallengeService,
        @Inject(forwardRef(() => LeaderboardService))
        protected readonly leaderboardService: LeaderboardService,
        @Inject(forwardRef(() => RewardService))
        protected readonly rewardService: RewardService,
        @Inject(forwardRef(() => RuleService))
        protected readonly ruleService: RuleService,
        @Inject(forwardRef(() => ExerciseService))
        protected readonly exerciseService: ExerciseService
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

    public async import(
        user: UserEntity, project_id: string, input: any
    ): Promise<void> {

        const directory = await Open.buffer(input.buffer);

        return await this.importProcessEntries(
            user,
            project_id,
            directory.files.reduce(
                (obj, item) => Object.assign(obj, { [item.path]: item }), {}
            )
        );
    }

    public async importProcessEntries(
        user: UserEntity, project_id: string, entries: any,
        exercises_map: any = {}
    ) {

        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            this.throwBadRequestException('Archive misses required metadata');
        }

        const gamification_layer = await this.importMetadataFile(user, project_id, root_metadata);

        await this.gamificationLayerSyncQueue.add(GAMIFICATION_LAYER_SYNC_CREATE, { user, gamification_layer });

        const result = Object.keys(entries).reduce(function(acc, curr) {
            const match = curr.match('^([a-zA-Z-]+)/([0-9a-zA-Z-]+)/(.*)$');
            if (!match || !acc[match[1]]) {
                return acc;
            }
            if (!acc[match[1]][match[2]]) {
                acc[match[1]][match[2]] = {};
            }
            acc[match[1]][match[2]][match[3]] = entries[curr];
            return acc;
        }, {
            'challenges': [],
            'leaderboards': [],
            'rewards': [],
            'rules': []
        });

        const challenge_results = [];
        const challenge_map = {};
        for (const key in result['challenges']) {
            if (result['challenges'].hasOwnProperty(key)) {
                const challenge_result = await this.challengeService.importProcessEntries(
                    user, gamification_layer, result['challenges'][key], exercises_map
                );
                challenge_results.push(challenge_result);
                challenge_map[key] = challenge_result.challenge.id;
            }
        }

        const asyncImporters = [];

        // 2nd pass
        challenge_results.forEach(challenge_result => {
            asyncImporters.push(
                this.challengeService.importProcessEntriesAfterAllChallengesImported(
                    user, gamification_layer, challenge_result.challenge, challenge_result.children,
                    challenge_result.related_entities, exercises_map, challenge_map
                )
            );
        });

        Object.keys(result['leaderboards']).forEach(related_entity_key => {
            asyncImporters.push(
                this.leaderboardService.importProcessEntries(
                    user, gamification_layer, result['leaderboards'][related_entity_key]
                )
            );
        });

        Object.keys(result['rewards']).forEach(related_entity_key => {
            asyncImporters.push(
                this.rewardService.importProcessEntries(
                    user, gamification_layer, result['rewards'][related_entity_key], undefined, exercises_map, challenge_map
                )
            );
        });

        Object.keys(result['rules']).forEach(related_entity_key => {
            asyncImporters.push(
                this.ruleService.importProcessEntries(
                    user, gamification_layer, result['rules'][related_entity_key]
                )
            );
        });

        await Promise.all(asyncImporters);
    }

    public async importMetadataFile(
        user: UserEntity, project_id: string, metadataFile: any
    ): Promise<GamificationLayerEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const gamification_layer: DeepPartial<GamificationLayerEntity> = {
            name: metadata.name,
            description: metadata.description,
            owner_id: user.id,
            keywords: metadata.keywords,
            status: metadata.status,
            project_id
        };

        return await this.repository.save(gamification_layer);
    }

    public async export(
        user: UserEntity, gamification_layer_id: string, exerciseFormat: string, format: string = 'zip', res: any
    ): Promise<void> {

        const archive: Archiver = create(format);

        archive.pipe(res);

        archive.on('error', function(err) {
            throw err;
        });

        const asyncArchiveWriters = [];

        await this.collectAllToExport(user, gamification_layer_id, exerciseFormat, archive, asyncArchiveWriters, '');

        await Promise.all(asyncArchiveWriters);

        await archive.finalize();
    }

    public async collectAllToExport(
        user: UserEntity,
        gamification_layer_id: string,
        exerciseFormat: string,
        archive: Archiver,
        asyncArchiveWriters: any[],
        archive_base_path: string
    ): Promise<void> {

        const gamification_layer: GamificationLayerEntity =
            await this.repository.findOne(gamification_layer_id, {
                loadRelationIds: {
                    relations: ['challenges', 'leaderboards', 'rewards', 'rules'
                    ]
                }
            });

        const exercises = new Set<string>();

        const base_path = `gamification-layers/${gamification_layer_id}/`;

        asyncArchiveWriters.push(
            this.addFileFromGithubToArchive(
                user, gamification_layer, archive, `${base_path}metadata.json`, `${archive_base_path}metadata.json`
            )
        );

        for (const challengeId of gamification_layer.challenges) {
            const challenge = await this.challengeService.findOne(challengeId);
            const challenge_path = `challenges/${challengeId}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, gamification_layer, archive, `${base_path}${challenge_path}metadata.json`, `${archive_base_path}${challenge_path}metadata.json`
                )
            );
            for (const exercise of challenge.exercise_ids) {
                exercises.add(exercise);
            }
        }

        for (const leaderboardId of gamification_layer.leaderboards) {
            const leaderboard = await this.leaderboardService.findOne(leaderboardId);
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

        for (const rewardId of gamification_layer.rewards) {
            const reward = await this.rewardService.findOne(rewardId);
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

        for (const ruleId of gamification_layer.rules) {
            const rule = await this.ruleService.findOne(ruleId);
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

        if (exerciseFormat) {
            for (const exercise of exercises) {
                const pass = new stream.PassThrough();
                if (exerciseFormat === 'yapexil') {
                    await this.exerciseService.export(user, exercise, 'zip', pass);
                } else if (exerciseFormat === 'mef') {
                    await this.exerciseService.exportMef(user, exercise, 'zip', pass);
                } else {
                    break;
                }
                archive.append(pass, { name: `${archive_base_path}exercises/${exercise}.zip` });
            }
        }
    }

    public async getAccessLevel(gl_id: string, user_id: string): Promise<AccessLevel> {
        return await getAccessLevel(
            [
                { src_table: 'project', dst_table: 'gl', prop: 'gamification_layers' }
            ],
            `gl.id = '${gl_id}'`,
            `permission.user_id = '${user_id}'`
        );
    }

    /* Private Methods */

    private async addFileFromGithubToArchive(
        user: UserEntity, gamification_layer: GamificationLayerEntity, archive: Archiver, path: string, archive_path: string
    ): Promise<void> {

        try {
            const contents = await this.githubApiService.getFileContents(
                user, gamification_layer.project_id, path
            );
            if (!contents || !contents.content) {
                return;
            }
            archive.append(
                Buffer.from(contents.content, 'base64'),
                { name: archive_path }
            );
        } catch (error) {
            // just log error
            this.logger.log(error);
        }
    }
}
