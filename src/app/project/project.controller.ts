import { Controller, UseGuards, Post, HttpCode, HttpStatus, Param, Body, UseInterceptors, Req, ForbiddenException } from '@nestjs/common';
import { Crud, CrudController, Override, ParsedRequest, CrudRequest, ParsedBody, CrudAuth } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { ApiUseTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { AppLogger } from '../app.logger';
import { User } from '../_helpers/decorators/user.decorator';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { ProjectEntity } from './entity/project.entity';
import { ProjectService } from './project.service';
import { ProjectCommand } from './project.command';
import { ProjectEmitter } from './project.emitter';

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

    private logger = new AppLogger(ProjectController.name);

    constructor(
        readonly service: ProjectService,
        readonly emitter: ProjectEmitter,
        readonly command: ProjectCommand
    ) { }

    get base(): CrudController<ProjectEntity> {
        return this;
    }

    @Post('import')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'NO CONTENT' })
    public async import(): Promise<void> {
        this.logger.silly(`[importProjects] execute `);
        return this.command.create(20);
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
        this.emitter.sendCreate(project);
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
        this.emitter.sendUpdate(project);
        return project;
    }

    @Override()
    async replaceOne(
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
        if (!dto.owner_id) {
            dto.owner_id = user.id;
        }
        const project = await this.base.replaceOneBase(parsedReq, dto);
        this.emitter.sendUpdate(project);
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
            this.emitter.sendDelete(project);
        }
        return project;
    }
}

