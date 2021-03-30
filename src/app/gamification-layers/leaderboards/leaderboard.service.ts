import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
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
import { GamificationLayerService } from '../gamification-layer.service';
import { GamificationLayerEntity } from '../entity/gamification-layer.entity';
import { ChallengeEntity } from '../challenges/entity/challenge.entity';

import { LeaderboardEntity } from './entity/leaderboard.entity';
import { LEADERBOARD_SYNC_CREATE, LEADERBOARD_SYNC_QUEUE } from './leaderboard.constants';

@Injectable()
export class LeaderboardService extends TypeOrmCrudService<LeaderboardEntity> {

    private logger = new AppLogger(LeaderboardService.name);

    constructor(
        @InjectRepository(LeaderboardEntity)
        protected readonly repository: Repository<LeaderboardEntity>,
        @InjectQueue(LEADERBOARD_SYNC_QUEUE) private readonly leaderboardSyncQueue: Queue,
        @Inject(forwardRef(() => GamificationLayerService))
        protected readonly glService: GamificationLayerService
    ) {
        super(repository);
    }

    public async getOne(req: CrudRequest): Promise<LeaderboardEntity> {
        return super.getOne(req);
    }

    public async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<LeaderboardEntity> | LeaderboardEntity[]> {
        return super.getMany(req);
    }

    public async createOne(req: CrudRequest, dto: DeepPartial<LeaderboardEntity>): Promise<LeaderboardEntity> {
        return super.createOne(req, dto);
    }

    public async updateOne(req: CrudRequest, dto: DeepPartial<LeaderboardEntity>): Promise<LeaderboardEntity> {
        return super.updateOne(req, dto);
    }

    public async replaceOne(req: CrudRequest, dto: DeepPartial<LeaderboardEntity>): Promise<LeaderboardEntity> {
        return super.replaceOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<void | LeaderboardEntity> {
        return super.deleteOne(req);
    }

    public async importProcessEntries(
        user: UserEntity, gamification_layer: GamificationLayerEntity, entries: any,
        parent_challenge?: ChallengeEntity
    ): Promise<void> {

        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            throw new BadRequestException('Archive misses required metadata');
        }

        await this.importMetadataFile(user, gamification_layer, root_metadata, parent_challenge);
    }

    public async importMetadataFile(
        user: UserEntity, gamification_layer: GamificationLayerEntity, metadataFile: any,
        parent_challenge?: ChallengeEntity
    ): Promise<LeaderboardEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const entity: LeaderboardEntity = await this.repository.save({
            name: metadata.name,
            metrics: metadata.metrics,
            sorting_orders: metadata.sorting_orders,
            challenge_id: parent_challenge ? parent_challenge.id : undefined,
            gl_id: gamification_layer.id
        });

        await this.leaderboardSyncQueue.add(
            LEADERBOARD_SYNC_CREATE, { user, leaderboard: entity }
        );

        return entity;
    }

    public async getAccessLevel(leaderboard_id: string, user_id: string): Promise<AccessLevel> {
        const leaderboard = await this.repository.findOne(leaderboard_id);
        return this.glService.getAccessLevel(leaderboard.gl_id, user_id);
    }
}
