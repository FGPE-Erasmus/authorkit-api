import {
    UseInterceptors,
    Controller,
    ClassSerializerInterceptor,
    UseGuards,
    Get,
    Headers,
    Req,
    ForbiddenException,
    BadRequestException,
    HttpCode,
    HttpStatus,
    Header,
    Res,
    InternalServerErrorException,
    Post,
    UploadedFile,
    Body
} from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiImplicitBody } from '@nestjs/swagger';
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
import { ImportDto } from './dto/import.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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

    @Post('import')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'dto', type: ImportDto, required: true })
    async import(
        @User() user: any,
        @Req() req,
        @UploadedFile() file,
        @Body() dto: ImportDto
    ) {
        if (!dto || !dto.project_id) {
            throw new BadRequestException('The id of the project must be specified');
        }
        const accessLevel = await this.projectService.getAccessLevel(dto.project_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.service.import(user, dto.project_id, file);
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
        @Headers('project') project: string,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        if (!project) {
            throw new BadRequestException('Exercises must be listed per project');
        }
        const accessLevel = await this.projectService.getAccessLevel(project, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        if (parsedReq.parsed.search) {
            let prevSearch;
            if (parsedReq.parsed.search.$and[3]) {
                prevSearch = parsedReq.parsed.search.$and[3];
            }
            if (prevSearch) {
                parsedReq.parsed.search.$and[3] = {
                    $and: [
                        prevSearch,
                        { project_id: project }
                    ]
                };
            } else {
                parsedReq.parsed.search.$and[3] = { project_id: project };
            }
        } else {
            parsedReq.parsed.filter.push({ field: 'project_id', operator: 'eq', value: project });
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
