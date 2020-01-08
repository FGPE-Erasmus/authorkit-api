import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { AppLogger } from '../app.logger';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { GamificationLayerEntity } from './entity/gamification-layer.entity';

@Injectable()
export class GamificationLayerService extends TypeOrmCrudService<GamificationLayerEntity> {

    private logger = new AppLogger(GamificationLayerService.name);

    constructor(
        @InjectRepository(GamificationLayerEntity)
        protected readonly repository: Repository<GamificationLayerEntity>
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
}
