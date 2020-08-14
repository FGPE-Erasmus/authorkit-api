import { Controller, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Crud, CrudController, Override, ParsedRequest, CrudRequest, ParsedBody } from '@nestjsx/crud';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { User } from '../_helpers/decorators/user.decorator';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { ExerciseService } from '../exercises/exercise.service';

import {
    TESTSET_SYNC_QUEUE,
    TESTSET_SYNC_CREATE,
    TESTSET_SYNC_UPDATE,
    TESTSET_SYNC_DELETE
} from './testset.constants';
import { TestSetService } from './testset.service';
import { TestSetEntity } from './entity/testset.entity';

@Controller('testsets')
@ApiTags('testsets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Crud({
    model: {
        type: TestSetEntity
    },
    params: {
        id: {
          field: 'id',
          type: 'uuid',
          primary: true
        }
    },
    routes: {
        getManyBase: {
            interceptors: [],
            decorators: []
        },
        getOneBase: {
            interceptors: [],
            decorators: []
        },
        createOneBase: {
            interceptors: [],
            decorators: []
        },
        updateOneBase: {
            interceptors: [],
            decorators: []
        },
        deleteOneBase: {
            interceptors: [],
            decorators: [],
            returnDeleted: true
        }
    }
})
export class TestSetController implements CrudController<TestSetEntity> {

    constructor(
        readonly service: TestSetService,
        @InjectQueue(TESTSET_SYNC_QUEUE) private readonly testsetSyncQueue: Queue,
        readonly exerciseService: ExerciseService
    ) {}

    get base(): CrudController<TestSetEntity> {
        return this;
    }

    @Override()
    async getOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.exerciseService.getAccessLevel(req.params.exercise_id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        return this.base.getOneBase(parsedReq);
    }

    @Override()
    async getMany(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const exerciseFilterIndex = parsedReq.parsed.filter
            .findIndex(f => f.field === 'exercise_id' && f.operator === 'eq');
        if (exerciseFilterIndex < 0) {
            throw new BadRequestException('Test sets must be listed per exercise');
        }
        const accessLevel = await this.exerciseService.getAccessLevel(
            parsedReq.parsed.filter[exerciseFilterIndex].value, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.base.getManyBase(parsedReq);
    }

    @Override()
    async createOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: TestSetEntity
    ) {
        const accessLevel = await this.exerciseService.getAccessLevel(dto.exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const testset = await this.base.createOneBase(parsedReq, dto);
        this.testsetSyncQueue.add(
            TESTSET_SYNC_CREATE, { user, testset }
        );
        return testset;
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: TestSetEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const testset = await this.base.updateOneBase(parsedReq, dto);
        this.testsetSyncQueue.add(
            TESTSET_SYNC_UPDATE, { user, testset }
        );
        return testset;
    }

    @Override()
    async deleteOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        const testset = await this.base.deleteOneBase(parsedReq);
        if (testset) {
            this.testsetSyncQueue.add(
                TESTSET_SYNC_DELETE, { user, testset }
            );
        }
        return testset;
    }
}
