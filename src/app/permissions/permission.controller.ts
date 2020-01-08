import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Crud, CrudController } from '@nestjsx/crud';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { PermissionLoaderInterceptor } from '../access-control/permission-loader.interceptor';

import { PERMISSION_CMD_CREATE, PERMISSION_CMD_UPDATE, PERMISSION_CMD_DELETE } from './permission.constants';
import { MinAccessLevel } from './decorators/min-access-level.decorator';
import { MinAccessLevelGuard } from './guards/min-access-level.guard';
import { AccessLevel, PermissionEntity } from './entity';
import { PermissionService } from './permission.service';

@Controller('permissions')
@ApiUseTags('permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
/* @Crud({
    model: {
        type: PermissionEntity
    },
    routes: {
        getManyBase: {
            interceptors: [
                new PermissionLoaderInterceptor(
                    ['query', 'project_id'],
                    [
                        { src_table: 'permission', 'dst_table': 'project', prop: 'project_id' }
                    ],
                    'permission.project_id = :id'
                )
            ],
            decorators: [
                UseGuards(MinAccessLevelGuard),
                MinAccessLevel(AccessLevel.ADMIN)
            ]
        },
        getOneBase: {
            interceptors: [
                new PermissionLoaderInterceptor(
                    ['params', 'id'],
                    [
                        { src_table: 'permission', 'dst_table': 'project', prop: 'project_id' }
                    ],
                    'permission.id = :id'
                )
            ],
            decorators: [
                UseGuards(MinAccessLevelGuard),
                MinAccessLevel(AccessLevel.ADMIN)
            ]
        },
        createOneBase: {
            interceptors: [
                new PermissionLoaderInterceptor(
                    ['body', 'project_id'],
                    [],
                    'permission.project_id = :id'
                )
            ],
            decorators: [
                UseGuards(MinAccessLevelGuard),
                MinAccessLevel(AccessLevel.ADMIN)
            ]
        },
        updateOneBase: {
            interceptors: [
                new PermissionLoaderInterceptor(
                    ['params', 'id'],
                    [
                        { src_table: 'permission', 'dst_table': 'project', prop: 'project_id' }
                    ],
                    'permission.id = :id'
                )
            ],
            decorators: [
                UseGuards(MinAccessLevelGuard),
                MinAccessLevel(AccessLevel.ADMIN)
            ]
        },
        replaceOneBase: {
            interceptors: [
                new PermissionLoaderInterceptor(
                    ['body', 'project_id'],
                    [],
                    'permission.project_id = :id'
                )
            ],
            decorators: [
                UseGuards(MinAccessLevelGuard),
                MinAccessLevel(AccessLevel.ADMIN)
            ]
        },
        deleteOneBase: {
            interceptors: [
                new PermissionLoaderInterceptor(
                    ['body', 'project_id'],
                    [],
                    'permission.project_id = :id'
                )
            ],
            decorators: [
                UseGuards(MinAccessLevelGuard),
                MinAccessLevel(AccessLevel.ADMIN)
            ],
            returnDeleted: true
        }
    }
}) */
export class PermissionController implements CrudController<PermissionEntity> {

    private logger = new AppLogger(PermissionController.name);

    constructor(
        readonly service: PermissionService
    ) {}

    get base(): CrudController<PermissionEntity> {
        return this;
    }

    @MessagePattern({ cmd: PERMISSION_CMD_CREATE })
    public async onPermissionCreate(permission: PermissionEntity): Promise<void> {
        try {
            this.logger.debug(`[onPermissionCreate] Create permission in Github repository`);
            // TODO
            this.logger.debug('[onPermissionCreate] Permission created in Github repository');
        } catch (err) {
            this.logger.error(`[onPermissionCreate] Permission NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: PERMISSION_CMD_UPDATE })
    public async onPermissionUpdate(permission: PermissionEntity): Promise<void> {
        try {
            this.logger.debug(`[onPermissionUpdate] Update permission in Github repository`);
            // TODO
            this.logger.debug('[onPermissionUpdate] Permission updated in Github repository');
        } catch (err) {
            this.logger.error(`[onPermissionUpdate] Permission NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: PERMISSION_CMD_DELETE })
    public async onPermissionDelete(permission: PermissionEntity): Promise<void> {
        try {
            this.logger.debug(`[onPermissionDelete] Update permission in Github repository`);
            // TODO
            this.logger.debug('[onPermissionDelete] Permission updated in Github repository');
        } catch (err) {
            this.logger.error(`[onPermissionDelete] Permission NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }
}
