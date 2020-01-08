import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { AppLogger } from '../../app.logger';
import { DeepPartial } from '../../_helpers/database/deep-partial';
import { getAccessLevel } from '../../_helpers/security/check-access-level';
import { AccessLevel } from '../../permissions/entity/access-level.enum';

import { ChallengeEntity } from './entity/challenge.entity';

@Injectable()
export class ChallengeService extends TypeOrmCrudService<ChallengeEntity> {

    private logger = new AppLogger(ChallengeService.name);

    constructor(
        @InjectRepository(ChallengeEntity)
        protected readonly repository: Repository<ChallengeEntity>
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

    public async getAccessLevel(challenge_id: string, user_id: string): Promise<AccessLevel> {
        return await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'gl', prop: 'gamification_layers' },
                { src_table: 'gl', dst_table: 'challenge', prop: 'challenges' }
            ],
            `challenge.id = '${challenge_id}' AND permission.user_id = '${user_id}'`
        );
    }
}
