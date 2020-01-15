import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Crud, CrudController, Override, ParsedRequest, CrudRequest, ParsedBody } from '@nestjsx/crud';

import { AppLogger } from '../../app.logger';
import { User } from '../../_helpers/decorators/user.decorator';
import { AccessLevel } from '../../permissions/entity/access-level.enum';
import { ExerciseTestSetEntity } from '../entity/exercise-test-set.entity';
import { ExerciseService } from '../exercise.service';
import { TestSetService } from './testset.service';

@Controller('exercises/:exercise_id/testsets')
@ApiUseTags('exercises/:exercise_id/testsets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Crud({
    model: {
        type: ExerciseTestSetEntity
    },
    params: {
        exercise_id: {
          field: 'exercise_id',
          type: 'uuid'
        },
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
        replaceOneBase: {
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
export class TestSetController implements CrudController<ExerciseTestSetEntity> {

    private logger = new AppLogger(TestSetController.name);

    constructor(
        readonly service: TestSetService,
        readonly exerciseService: ExerciseService
    ) {}

    get base(): CrudController<ExerciseTestSetEntity> {
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
        @ParsedBody() dto: ExerciseTestSetEntity
    ) {
        const accessLevel = await this.exerciseService.getAccessLevel(req.params.exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.base.createOneBase(parsedReq, dto);
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ExerciseTestSetEntity
    ) {
        const accessLevel = await this.exerciseService.getAccessLevel(req.params.exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.base.updateOneBase(parsedReq, dto);
    }

    @Override()
    async replaceOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ExerciseTestSetEntity
    ) {
        const accessLevel = await this.exerciseService.getAccessLevel(req.params.exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.base.replaceOneBase(parsedReq, dto);
    }

    @Override()
    async deleteOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.exerciseService.getAccessLevel(req.params.exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.base.deleteOneBase(parsedReq);
    }
}
