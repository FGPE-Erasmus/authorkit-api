import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { getParamValueFromCrudRequest } from '../_helpers';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { AccessLevel } from '../permissions/entity/access-level.enum';

import { TestSetEntity } from './entity/testset.entity';

@Injectable()
export class TestSetService extends TypeOrmCrudService<TestSetEntity> {

    constructor(
        @InjectRepository(TestSetEntity)
        protected readonly repository: Repository<TestSetEntity>,

        protected readonly githubApiService: GithubApiService
    ) {
        super(repository);
    }

    public async createOne(req: CrudRequest, dto: DeepPartial<TestSetEntity>): Promise<TestSetEntity> {
        return super.createOne(req, dto);
    }

    public async updateOne(req: CrudRequest, dto: DeepPartial<TestSetEntity>): Promise<TestSetEntity> {
        return super.updateOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<void | TestSetEntity> {
        return await super.deleteOne(req);
    }

    public async getAccessLevel(id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' },
                { src_table: 'exercise', dst_table: 'testset', prop: 'test_sets' }
            ],
            `testset.id = '${id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }
}
