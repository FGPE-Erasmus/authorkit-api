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
import { GamificationLayerService } from '../gamification-layer.service';
import { GamificationLayerEntity } from '../entity/gamification-layer.entity';
import { ChallengeEntity } from '../challenges/entity/challenge.entity';

import { RuleEntity } from './entity/rule.entity';
import { RULE_SYNC_QUEUE, RULE_SYNC_CREATE } from './rule.constants';

@Injectable()
export class RuleService extends TypeOrmCrudService<RuleEntity> {

    private logger = new AppLogger(RuleService.name);

    constructor(
        @InjectRepository(RuleEntity)
        protected readonly repository: Repository<RuleEntity>,
        @InjectQueue(RULE_SYNC_QUEUE) private readonly ruleSyncQueue: Queue,
        @Inject(forwardRef(() => GamificationLayerService))
        protected readonly glService: GamificationLayerService
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

    public async importProcessEntries(
        user: UserEntity, gamification_layer: GamificationLayerEntity, entries: any,
        parent_challenge?: ChallengeEntity
    ): Promise<void> {

        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            throw new BadRequestException('Archive misses required metadata');
        }

        await this.importMetadataFile(
            user, gamification_layer, root_metadata, parent_challenge
        );
    }

    public async importMetadataFile(
        user: UserEntity,
        gamification_layer: GamificationLayerEntity,
        metadata_file: any,
        parent_challenge?: ChallengeEntity
    ): Promise<RuleEntity> {

        const metadata = JSON.parse((await metadata_file.buffer()).toString());

        const entity: RuleEntity = await this.repository.save({
            name: metadata.name,
            actions: metadata.actions,
            criteria: metadata.criteria,
            challenge_id: parent_challenge ? parent_challenge.id : undefined,
            gl_id: gamification_layer.id
        });

        this.ruleSyncQueue.add(
            RULE_SYNC_CREATE, { user, rule: entity }
        );

        return entity;
    }

    public async getAccessLevel(rule_id: string, user_id: string): Promise<AccessLevel> {
        const rule = await this.repository.findOne(rule_id);
        return this.glService.getAccessLevel(rule.gl_id, user_id);
    }
}
