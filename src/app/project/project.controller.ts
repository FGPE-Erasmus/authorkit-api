import { Controller, UseGuards, Post, HttpCode, HttpStatus, Param, Body, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';
import { ApiUseTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { config } from '../../config';
import { RestController } from '../../base';
import { AppLogger } from '../app.logger';
import { ProjectEntity, PermissionEntity } from './entity';
import { ProjectCommand } from './project.command';
import { ProjectService } from './project.service';
import { ProjectUserService } from '../project-user/project-user.service';
import { AddPermissionDto } from './dto/add-permission.dto';

@ApiUseTags('project')
@Controller('project')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class ProjectController extends RestController<ProjectEntity> {

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    private logger = new AppLogger(ProjectController.name);

    constructor(
        readonly service: ProjectService,
        private projectCmd: ProjectCommand
    ) {
        super();
    }

    @Post('import/projects')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'NO CONTENT' })
    public async importProjects(): Promise<void> {
        this.logger.silly(`[importProjects] execute `);
        return this.projectCmd.create(20);
    }

    @Get('/')
    public findAll(@Req() req): Promise<ProjectEntity[]> {
        return this.service.findAccessibleProjects();
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

