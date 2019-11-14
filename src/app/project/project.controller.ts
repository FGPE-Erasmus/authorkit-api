import { Controller, UseGuards, Post, HttpCode, HttpStatus, Param, Body, UseInterceptors } from '@nestjs/common';
import { Crud, CrudController, Override, ParsedRequest, CrudRequest, ParsedBody, CrudAuth } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { ApiUseTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { RequestContext } from '../_helpers';
import { AppLogger } from '../app.logger';
import {
    UseRoles,
    ResourcePossession,
    CrudOperationEnum,
    UseContextAccessEvaluator,
    ACGuard,
    AccessControlRequestInterceptor,
    AccessControlResponseInterceptor
} from '../access-control';
import { ProjectEntity, PermissionEntity } from './entity';
import { ProjectService } from './project.service';
import { evaluateUserContextAccess } from './security/project-context-access.evaluator';
import { AddPermissionDto } from './dto/add-permission.dto';
import { ProjectCommand } from './project.command';
import { UserEntity } from 'app/user/entity';

@ApiUseTags('projects')
@Controller('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), ACGuard)
@Crud({
    model: {
        type: ProjectEntity
    },
    routes: {
        exclude: ['createManyBase'],
        getManyBase: {
            interceptors: [AccessControlResponseInterceptor],
            decorators: [
                UseRoles({
                    resource: 'project',
                    action: CrudOperationEnum.LIST,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        getOneBase: {
            interceptors: [AccessControlResponseInterceptor],
            decorators: [
                UseRoles({
                    resource: 'project',
                    action: CrudOperationEnum.READ,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        updateOneBase: {
            interceptors: [AccessControlRequestInterceptor],
            decorators: [
                UseRoles({
                    resource: 'project',
                    action: CrudOperationEnum.PATCH,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        replaceOneBase: {
            interceptors: [AccessControlRequestInterceptor],
            decorators: [
                UseRoles({
                    resource: 'project',
                    action: CrudOperationEnum.UPDATE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        deleteOneBase: {
            interceptors: [],
            decorators: [
                UseRoles({
                    resource: 'project',
                    action: CrudOperationEnum.DELETE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ],
            returnDeleted: true
        }
    },
    query: {
        join: {
            permissions: {
                eager: true
            }
        }
    }
})
@CrudAuth({
    property: 'user',
    filter: (user: UserEntity) => ({
        $or: [
            { 'owner_id': user.id },
            { 'permissions.user_id': user.id }
        ]
    })
})
export class ProjectController implements CrudController<ProjectEntity> {

    private logger = new AppLogger(ProjectController.name);

    constructor(
        readonly service: ProjectService,
        readonly projectCmd: ProjectCommand
    ) { }

    get base(): CrudController<ProjectEntity> {
        return this;
    }

    @Post('import')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'NO CONTENT' })
    public async import(): Promise<void> {
        this.logger.silly(`[importProjects] execute `);
        return this.projectCmd.create(20);
    }

    @Override()
    @UseRoles({
        resource: 'project',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(AccessControlRequestInterceptor)
    createOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: ProjectEntity
    ) {
        if (!dto.owner_id) {
            dto.owner_id = RequestContext.currentUser().id;
        }
        return this.base.createOneBase(req, dto);
    }

    @Post('/:id/permissions')
    public async share(@Param('id') id: string, @Body() data: AddPermissionDto): Promise<PermissionEntity> {
        this.logger.silly(`[share] sharing project ${id}`);
        return this.service.share(id, data);
    }

    @Post('/:id/permissions/:user_id')
    public async revoke(@Param('id') id: string, @Param('user_id') user_id: string): Promise<PermissionEntity> {
        this.logger.silly(`[revoke] revoking permissions of ${user_id} on project ${id}`);
        return this.service.revoke(id, user_id);
    }
}

