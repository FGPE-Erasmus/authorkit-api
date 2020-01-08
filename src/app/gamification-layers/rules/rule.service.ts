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

import { RuleEntity } from './entity/rule.entity';

@Injectable()
export class RuleService extends TypeOrmCrudService<RuleEntity> {

    private logger = new AppLogger(RuleService.name);

    constructor(
        @InjectRepository(RuleEntity)
        protected readonly repository: Repository<RuleEntity>,
        protected readonly glService: GamificationLayerService,
        protected readonly challengeService: ChallengeService
    ) {
        super(repository);
    }

    public async getOne(req: CrudRequest): Promise<RuleEntity> {
        return super.getOne(req);
    }

    public async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<RuleEntity> | RuleEntity[]> {
        return super.getMany(req);
    }

    public async createOne(req: CrudRequest, dto: DeepPartial<RuleEntity>): Promise<RuleEntity> {
        return super.createOne(req, dto);
    }

    public async updateOne(req: CrudRequest, dto: DeepPartial<RuleEntity>): Promise<RuleEntity> {
        return super.updateOne(req, dto);
    }

    public async replaceOne(req: CrudRequest, dto: DeepPartial<RuleEntity>): Promise<RuleEntity> {
        return super.replaceOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<void | RuleEntity> {
        return super.deleteOne(req);
    }

    public async getAccessLevel(rule_id: string, user_id: string): Promise<AccessLevel> {
        const rule = await this.repository.findOne(rule_id);
        if (rule.gl_id) {
            return this.glService.getAccessLevel(rule.gl_id, user_id);
        } else if (rule.challenge_id) {
            return this.challengeService.getAccessLevel(
                rule.challenge_id, user_id);
        }
        return AccessLevel.NONE;
    }
}
