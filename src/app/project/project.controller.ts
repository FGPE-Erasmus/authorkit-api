import {
    ClassSerializerInterceptor,
    Controller,
    ForbiddenException,
    Get,
    Header,
    HttpCode,
    HttpStatus,
    InternalServerErrorException,
    Post,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, Override, ParsedBody, ParsedRequest } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { ApiFile } from '../_helpers/decorators/api-file.decorator';
import { User } from '../_helpers/decorators/user.decorator';
import { DeepPartial } from '../_helpers/database/deep-partial';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { ProjectEntity } from './entity/project.entity';
import { ProjectService } from './project.service';
import { PROJECT_SYNC_CREATE_REPO, PROJECT_SYNC_DELETE_REPO, PROJECT_SYNC_QUEUE, PROJECT_SYNC_UPDATE_REPO } from './project.constants';
import { filterReadDto, filterReadMany, filterUpdateDto } from './security/project.security';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('projects')
@Controller('projects')
@Crud({
    model: {
        type: ProjectEntity
    },
    dto: {
        update: UpdateProjectDto
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
            decorators: [],
            allowParamsOverride: false
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
    },
    query: {
        join: {
            permissions: {
                eager: true
            },
            exercises: {
            },
            gamification_layers: {
            }
        }
    }
})
export class ProjectController implements CrudController<DeepPartial<ProjectEntity>> {

    constructor(
        readonly service: ProjectService,
        @InjectQueue(PROJECT_SYNC_QUEUE) private readonly projectSyncQueue: Queue
    ) { }

    get base(): CrudController<DeepPartial<ProjectEntity>> {
        return this;
    }

    @Post('import')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiFile({ name: 'file', required: true })
    async import(
        @User() user: any,
        @Req() req,
        @UploadedFile() file
    ) {
        return this.service.import(user, file);
    }

    @Get(':id/export')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
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
        } catch (err) {
            throw new InternalServerErrorException('Archive creation failed');
        }
    }

    @Get(':id/public-export')
    @HttpCode(HttpStatus.OK)
    @Header('Content-Type', 'application/octet-stream')
    async publicExport(
        @Req() req,
        @Res() res
    ) {
        if (!(await this.service.isPublicProject(req.params.id))) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        res.set(
            'Content-Disposition',
            `attachment; filename=${req.params.id}.${req.query.format || 'zip'}`
        );
        try {
            await this.service.export(undefined, req.params.id, req.query.format || 'zip', res);
        } catch (err) {
            throw new InternalServerErrorException('Archive creation failed');
        }
    }

    @Get('public-list')
    @UseInterceptors(CrudRequestInterceptor, ClassSerializerInterceptor)
    @HttpCode(HttpStatus.OK)
    @Header('Content-Type', 'application/json')
    async publicList(
        @ParsedRequest() parsedReq
    ) {
        if (parsedReq.parsed.search) {
            let prevSearch;
            if (parsedReq.parsed.search.$and[3]) {
                prevSearch = parsedReq.parsed.search.$and[3];
            }
            if (prevSearch) {
                parsedReq.parsed.search.$and[3] = {
                    $and: [
                        prevSearch,
                        { 'is_public': true }
                    ]
                };
            } else {
                parsedReq.parsed.search.$and[3] = { 'is_public': true };
            }
        } else {
            parsedReq.parsed.filter.push({ field: 'is_public', operator: 'eq', value: true });
        }
        return await this.service.getManyAndCountContributorsAndExercises(parsedReq);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
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
        return filterReadDto(await this.base.getOneBase(parsedReq), accessLevel);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Override()
    async getMany(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        if (parsedReq.parsed.search) {
            let prevSearch;
            if (parsedReq.parsed.search.$and[3]) {
                prevSearch = parsedReq.parsed.search.$and[3];
            }
            if (prevSearch) {
                parsedReq.parsed.search.$and[3] = {
                    $and: [
                        prevSearch,
                        {
                            $or: [
                                { 'is_public': true },
                                {
                                    $and: [
                                        { 'permissions.user_id': user.id },
                                        { 'permissions.access_level': { '$gte': AccessLevel.VIEWER } }
                                    ]
                                }
                            ]
                        }
                    ]
                };
            } else {
                parsedReq.parsed.search.$and[3] = {
                    $or: [
                        { 'is_public': true },
                        {
                            $and: [
                                { 'permissions.user_id': user.id },
                                { 'permissions.access_level': { '$gte': AccessLevel.VIEWER } }
                            ]
                        }
                    ]
                };
            }
        } else {
            parsedReq.parsed.filter.push({ field: 'permissions.user_id', operator: 'eq', value: user.id });
            parsedReq.parsed.filter.push({ field: 'permissions.access_level', operator: 'eq', value: AccessLevel.VIEWER });
        }
        const projects = await this.service.getManyAndCountContributorsAndExercises(parsedReq);
        return filterReadMany(projects, user);
    }

    @Get(':id/users')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    @Header('Content-Type', 'application/json')
    async getProjectUsers(
        @User() user: any,
        @Req() req
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.ADMIN) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        return this.service.getProjectUsers(req.params.id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Override()
    async createOne(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ProjectEntity
    ) {
        dto.owner_id = user.id;
        const project = await this.base.createOneBase(parsedReq, dto);
        await this.projectSyncQueue.add(PROJECT_SYNC_CREATE_REPO, { user, project });
        return project;
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: UpdateProjectDto
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const project = await this.base.updateOneBase(parsedReq, filterUpdateDto(dto, accessLevel));
        await this.projectSyncQueue.add(PROJECT_SYNC_UPDATE_REPO, { user, project });
        return project;
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Override()
    async deleteOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.OWNER) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        const project = await this.base.deleteOneBase(parsedReq);
        if (project) {
            await this.projectSyncQueue.add(PROJECT_SYNC_DELETE_REPO, { user, project });
        }
        return project;
    }
}

