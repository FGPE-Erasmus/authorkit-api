import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { DeepPartial } from '../../_helpers/database/deep-partial';
import { getAccessLevel } from '../../_helpers/security/check-access-level';
import { AccessLevel } from '../../permissions/entity/access-level.enum';
import { UserEntity } from '../../user/entity/user.entity';
import { GamificationLayerEntity } from '../entity/gamification-layer.entity';
import { LeaderboardService } from '../leaderboards/leaderboard.service';
import { RewardService } from '../rewards/reward.service';
import { RuleService } from '../rules/rule.service';

import { ChallengeEntity } from './entity/challenge.entity';
import { CHALLENGE_SYNC_QUEUE, CHALLENGE_SYNC_CREATE } from './challenge.constants';

@Injectable()
export class ChallengeService extends TypeOrmCrudService<ChallengeEntity> {

    constructor(
        @InjectRepository(ChallengeEntity)
        protected readonly repository: Repository<ChallengeEntity>,

        @InjectQueue(CHALLENGE_SYNC_QUEUE) private readonly challengeSyncQueue: Queue,

        @Inject(forwardRef(() => LeaderboardService))
        protected readonly leaderboardService: LeaderboardService,

        @Inject(forwardRef(() => RewardService))
        protected readonly rewardService: RewardService,

        @Inject(forwardRef(() => RuleService))
        protected readonly ruleService: RuleService
    ) {
        super(repository);
    }

    public async getOne(req: CrudRequest): Promise<ChallengeEntity> {
        return super.getOne(req);
    }

    public async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<ChallengeEntity> | ChallengeEntity[]> {
        return super.getMany(req);
    }

    public async createOne(req: CrudRequest, dto: DeepPartial<ChallengeEntity>): Promise<ChallengeEntity> {
        return super.createOne(req, dto);
    }

    public async updateOne(req: CrudRequest, dto: DeepPartial<ChallengeEntity>): Promise<ChallengeEntity> {
        return super.updateOne(req, dto);
    }

    public async replaceOne(req: CrudRequest, dto: DeepPartial<ChallengeEntity>): Promise<ChallengeEntity> {
        return super.replaceOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<void | ChallengeEntity> {
        return super.deleteOne(req);
    }

    public async importProcessEntries(
        user: UserEntity, gamification_layer: GamificationLayerEntity, entries: any,
        exercises_map: any = {}
    ): Promise<{ challenge: ChallengeEntity, children: string[], related_entities: any }> {

        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            throw new BadRequestException('Archive misses required metadata');
        }

        const { entity, children } = await this.importMetadataFile(
            user, gamification_layer, root_metadata, exercises_map
        );

        const related_entities = Object.keys(entries).reduce(function(acc, curr) {
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
            'leaderboards': [],
            'rewards': [],
            'rules': []
        });

        return { challenge: entity, children, related_entities };
    }

    public async importProcessEntriesAfterAllChallengesImported(
        user: UserEntity,
        gamification_layer: GamificationLayerEntity,
        challenge: ChallengeEntity, children: string[], related_entities: any,
        exercises_map: any = {}, challenges_map: any = {}
    ) {

        children.forEach(old_child_id => {
            const child_id = challenges_map[old_child_id];
            if (!child_id) {
                return;
            }
            this.repository.update(child_id, { parent_challenge_id: challenge.id });
        });

        this.challengeSyncQueue.add(
            CHALLENGE_SYNC_CREATE, { user, challenge: (await this.findOne(challenge.id)) }
        );

        const asyncImporters = [];

        Object.keys(related_entities['leaderboards']).forEach(related_entity_key => {
            asyncImporters.push(
                this.leaderboardService.importProcessEntries(
                    user, gamification_layer, related_entities['leaderboards'][related_entity_key], challenge
                )
            );
        });

        Object.keys(related_entities['rewards']).forEach(related_entity_key => {
            asyncImporters.push(
                this.rewardService.importProcessEntries(
                    user, gamification_layer, related_entities['rewards'][related_entity_key],
                    challenge, exercises_map, challenges_map
                )
            );
        });

        Object.keys(related_entities['rules']).forEach(related_entity_key => {
            asyncImporters.push(
                this.ruleService.importProcessEntries(
                    user, gamification_layer, related_entities['rules'][related_entity_key], challenge
                )
            );
        });

        await Promise.all(asyncImporters);
    }

    public async importMetadataFile(
        user: UserEntity, gamification_layer: GamificationLayerEntity, metadataFile: any,
        exercises_map: any = {}
    ): Promise<{ entity: ChallengeEntity, children: string[] }> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: ChallengeEntity = await this.repository.save({
            name: metadata.name,
            description: metadata.description,
            exercises: metadata.refs.map(e => exercises_map[e]).filter(r => !!r).map(e => ({ id: e })),
            mode: metadata.mode,
            mode_parameters: metadata.mode_parameters,
            locked: metadata.locked,
            hidden: metadata.hidden,
            difficulty: metadata.difficulty,
            gl_id: gamification_layer.id
        });

        return { entity, children: metadata.children };
    }

    public async getAccessLevel(challenge_id: string, user_id: string): Promise<AccessLevel> {
        return await getAccessLevel(
            [
                { src_table: 'project', dst_table: 'gl', prop: 'gamification_layers' },
                { src_table: 'gl', dst_table: 'challenge', prop: 'challenges' }
            ],
            `challenge.id = '${challenge_id}'`,
            `permission.user_id = '${user_id}'`
        );
    }
}
