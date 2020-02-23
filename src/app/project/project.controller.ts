import { Controller, UseGuards, Req, ForbiddenException, InternalServerErrorException, Res, HttpCode, Get, Header, HttpStatus } from '@nestjs/common';
import { Crud, CrudController, Override, ParsedRequest, CrudRequest, ParsedBody } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { User } from '../_helpers/decorators/user.decorator';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { ProjectEntity } from './entity/project.entity';
import { ProjectService } from './project.service';
import {
    PROJECT_SYNC_QUEUE,
    PROJECT_SYNC_CREATE,
    PROJECT_SYNC_UPDATE,
    PROJECT_SYNC_DELETE
} from './project.constants';

@ApiUseTags('projects')
@Controller('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Crud({
    model: {
        type: ProjectEntity
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
    },
    query: {
        join: {
            permissions: {
            },
            exercises: {
            },
            gamification_layers: {
            }
        }
    }
})
export class ProjectController implements CrudController<ProjectEntity> {

    constructor(
        readonly service: ProjectService,
        @InjectQueue(PROJECT_SYNC_QUEUE) private readonly projectSyncQueue: Queue
    ) { }

    get base(): CrudController<ProjectEntity> {
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
        parsedReq.parsed.join.push({ field: 'permissions' });
        parsedReq.parsed.filter.push({ field: 'permissions.access_level', operator: 'gte', value: AccessLevel.VIEWER });
        parsedReq.parsed.filter.push({ field: 'permissions.user_id', operator: 'eq', value: user.id });
        return this.base.getManyBase(parsedReq);
    }

    @Override()
    async createOne(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ProjectEntity
    ) {
        if (!dto.owner_id) {
            dto.owner_id = user.id;
        }
        const project = await this.base.createOneBase(parsedReq, dto);
        this.projectSyncQueue.add(PROJECT_SYNC_CREATE, { project });
        return project;
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ProjectEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const project = await this.base.updateOneBase(parsedReq, dto);
        this.projectSyncQueue.add(PROJECT_SYNC_UPDATE, { project });
        return project;
    }

    @Override()
    async deleteOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        const project = await this.base.deleteOneBase(parsedReq);
        if (project) {
            this.projectSyncQueue.add(PROJECT_SYNC_DELETE, { project });
        }
        return project;
    }
}

