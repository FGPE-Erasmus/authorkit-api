import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { AppLogger } from '../../app.logger';
import { DeepPartial } from '../../_helpers/database/deep-partial';
import { AccessLevel } from '../../permissions/entity/access-level.enum';
import { GamificationLayerService } from '../gamification-layer.service';
import { ChallengeService } from '../challenges/challenge.service';

import { LeaderboardEntity } from './entity/leaderboard.entity';

@Injectable()
export class LeaderboardService extends TypeOrmCrudService<LeaderboardEntity> {

    private logger = new AppLogger(LeaderboardService.name);

    constructor(
        @InjectRepository(LeaderboardEntity)
        protected readonly repository: Repository<LeaderboardEntity>,
        protected readonly glService: GamificationLayerService,
        protected readonly challengeService: ChallengeService
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

    public async getAccessLevel(leaderboard_id: string, user_id: string): Promise<AccessLevel> {
        const leaderboard = await this.repository.findOne(leaderboard_id);
        if (leaderboard.gl_id) {
            return this.glService.getAccessLevel(
                leaderboard.gl_id, user_id);
        } else if (leaderboard.challenge_id) {
            return this.challengeService.getAccessLevel(
                leaderboard.challenge_id, user_id);
        }
        return AccessLevel.NONE;
    }
}
