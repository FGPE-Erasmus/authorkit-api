import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { config } from '../../config';

import { PROJECT_CMD_CREATE, PROJECT_CMD_UPDATE, PROJECT_CMD_DELETE } from './project.constants';
import { ProjectEntity } from './entity/project.entity';

@Injectable()
export class ProjectEmitter {

    private logger = new AppLogger(ProjectEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(project: ProjectEntity): void {
        this.client.send({ cmd: PROJECT_CMD_CREATE }, project)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(project: ProjectEntity): void {
        this.client.send({ cmd: PROJECT_CMD_UPDATE }, project)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(project: ProjectEntity): void {
        this.client.send({ cmd: PROJECT_CMD_DELETE }, project)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
