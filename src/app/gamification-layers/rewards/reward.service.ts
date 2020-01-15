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

import { RewardEntity } from './entity/reward.entity';

@Injectable()
export class RewardService extends TypeOrmCrudService<RewardEntity> {

    private logger = new AppLogger(RewardService.name);

    constructor(
        @InjectRepository(RewardEntity)
        protected readonly repository: Repository<RewardEntity>,
        protected readonly glService: GamificationLayerService,
        protected readonly challengeService: ChallengeService
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

    public async getAccessLevel(reward_id: string, user_id: string): Promise<AccessLevel> {
        const reward = await this.repository.findOne(reward_id);
        return this.glService.getAccessLevel(reward.gl_id, user_id);
    }
}
