import {
    UseInterceptors,
    Controller,
    ClassSerializerInterceptor,
    UseGuards,
    Get,
    Req,
    ForbiddenException,
    BadRequestException,
    HttpCode,
    HttpStatus,
    Header,
    Res,
    InternalServerErrorException
} from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrudController, Override, ParsedBody, ParsedRequest, CrudRequest, Crud } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { User } from '../_helpers/decorators/user.decorator';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { ProjectService } from '../project/project.service';

import { ExerciseEntity } from './entity/exercise.entity';
import { ExerciseService } from './exercise.service';
import {
    EXERCISE_SYNC_QUEUE,
    EXERCISE_SYNC_CREATE,
    EXERCISE_SYNC_UPDATE,
    EXERCISE_SYNC_DELETE
} from './exercise.constants';

@Controller('exercises')
@ApiUseTags('exercises')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: ExerciseEntity
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
    },
    query: {
        join: {
            'instructions': {
            },
            'statements': {
            },
            'embeddables': {
            },
            'skeletons': {
            },
            'libraries': {
            },
            'static_correctors': {
            },
            'dynamic_correctors': {
            },
            'solutions': {
            },
            'templates': {
            },
            'tests': {
            },
            'test_sets': {
            },
            'test_generators': {
            },
            'feedback_generators': {
            }
        }
    }
})
export class ExerciseController implements CrudController<ExerciseEntity> {

    constructor(
        readonly service: ExerciseService,
        @InjectQueue(EXERCISE_SYNC_QUEUE) private readonly exerciseSyncQueue: Queue,
        readonly projectService: ProjectService
    ) { }

    get base(): CrudController<ExerciseEntity> {
        return this;
    }

    @Get(':id/export')
    @HttpCode(HttpStatus.OK)
    @Header('Content-Type', 'application/octet-stream')
    async export(
        @User() user: any,
        @Req() req,
        @Res() res
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        res.set(
            'Content-Disposition',
            `attachment; filename=${req.params.id}.${req.query.format || 'zip'}`
        );
        try {
            await this.service.export(user, req.params.id, req.query.format || 'zip', res);
            res.end();
        } catch (err) {
            throw new InternalServerErrorException('Archive creation failed');
        }
    }

    @Override()
    async getOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
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
        const projectFilterIndex = parsedReq.parsed.filter
            .findIndex(f => f.field === 'project_id' && f.operator === 'eq');
        if (projectFilterIndex < 0) {
            throw new BadRequestException('Exercises must be listed per project');
        }
        const accessLevel = await this.projectService.getAccessLevel(
            parsedReq.parsed.filter[projectFilterIndex].value, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.base.getManyBase(parsedReq);
    }

    @Override()
    async createOne(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ExerciseEntity
    ) {
        const accessLevel = await this.projectService.getAccessLevel(dto.project_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        if (!dto.owner_id) {
            dto.owner_id = user.id;
        }
        const exercise = await this.base.createOneBase(parsedReq, dto);
        this.exerciseSyncQueue.add(EXERCISE_SYNC_CREATE, { user, exercise });
        return exercise;
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ExerciseEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const exercise = await this.base.updateOneBase(parsedReq, dto);
        this.exerciseSyncQueue.add(EXERCISE_SYNC_UPDATE, { user, exercise });
        return exercise;
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
        const exercise = await this.base.deleteOneBase(parsedReq);
        if (exercise) {
            this.exerciseSyncQueue.add(EXERCISE_SYNC_DELETE, { user, exercise });
        }
        return exercise;
    }
}
