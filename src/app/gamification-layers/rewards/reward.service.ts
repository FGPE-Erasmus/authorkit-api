import { Injectable, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { AppLogger } from '../../app.logger';
import { DeepPartial } from '../../_helpers/database/deep-partial';
import { AccessLevel } from '../../permissions/entity/access-level.enum';
import { UserEntity } from '../../user/entity/user.entity';
import { GamificationLayerEntity } from '../entity/gamification-layer.entity';
import { ChallengeEntity } from '../challenges/entity/challenge.entity';
import { GamificationLayerService } from '../gamification-layer.service';

import { RewardEntity } from './entity/reward.entity';
import { REWARD_SYNC_QUEUE, REWARD_SYNC_CREATE } from './reward.constants';

@Injectable()
export class RewardService extends TypeOrmCrudService<RewardEntity> {

    private logger = new AppLogger(RewardService.name);

    constructor(
        @InjectRepository(RewardEntity)
        protected readonly repository: Repository<RewardEntity>,
        @InjectQueue(REWARD_SYNC_QUEUE) private readonly rewardSyncQueue: Queue,
        @Inject(forwardRef(() => GamificationLayerService))
        protected readonly glService: GamificationLayerService
    ) {
        super(repository);
    }

    public async getOne(req: CrudRequest): Promise<RewardEntity> {
        return super.getOne(req);
    }

    public async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<RewardEntity> | RewardEntity[]> {
        return super.getMany(req);
    }

    public async createOne(req: CrudRequest, dto: DeepPartial<RewardEntity>): Promise<RewardEntity> {
        return super.createOne(req, dto);
    }

    public async updateOne(req: CrudRequest, dto: DeepPartial<RewardEntity>): Promise<RewardEntity> {
        return super.updateOne(req, dto);
    }

    public async replaceOne(req: CrudRequest, dto: DeepPartial<RewardEntity>): Promise<RewardEntity> {
        return super.replaceOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<void | RewardEntity> {
        return super.deleteOne(req);
    }

    public async importProcessEntries(
        user: UserEntity, gamification_layer: GamificationLayerEntity, entries: any,
        parent_challenge?: ChallengeEntity,
        exercises_map: any = {},
        challenges_map: any = {}
    ): Promise<void> {

        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            throw new BadRequestException('Archive misses required metadata');
        }

        await this.importMetadataFile(
            user, gamification_layer, root_metadata,
            parent_challenge, exercises_map, challenges_map
        );
    }

    public async importMetadataFile(
        user: UserEntity,
        gamification_layer: GamificationLayerEntity,
        metadataFile: any,
        parent_challenge?: ChallengeEntity,
        exercises_map: any = {},
        challenges_map: any = {}
    ): Promise<RewardEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: RewardEntity = await this.repository.save({
            name: metadata.name,
            description: metadata.description,
            kind: metadata.kind,
            image: metadata.image,
            cost: metadata.cost,
            recurrent: metadata.recurrent,
            amount: metadata.amount,
            message: metadata.message,
            challenges: metadata.challenges ? metadata.challenges
                .map(id => ({ id: challenges_map[id] }))
                .filter(challenge => !!challenge) : [],
            challenge_id: parent_challenge ? parent_challenge.id : undefined,
            gl_id: gamification_layer.id
        });

        await this.rewardSyncQueue.add(
            REWARD_SYNC_CREATE, { user, reward: entity }
        );

        return entity;
    }

    public async getAccessLevel(reward_id: string, user_id: string): Promise<AccessLevel> {
        const reward = await this.repository.findOne(reward_id);
        return this.glService.getAccessLevel(reward.gl_id, user_id);
    }
}
