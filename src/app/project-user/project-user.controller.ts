import { Controller, UseGuards, Post, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';
import { ApiUseTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { config } from '../../config';
import { RestController } from '../../base';
import { AppLogger } from '../app.logger';
import { ProjectUserEntity } from './entity';
import { ProjectUserService } from './project-user.service';

@ApiUseTags('project-user')
@Controller('project-user')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class ProjectUserController extends RestController<ProjectUserEntity> {

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    private logger = new AppLogger(ProjectUserController.name);

    constructor(
        readonly service: ProjectUserService
    ) {
        super();
    }

}

