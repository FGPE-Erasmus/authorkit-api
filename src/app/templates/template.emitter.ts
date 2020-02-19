import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { TemplateEntity } from './entity/template.entity';
import {
    TEMPLATE_CMD_CREATE,
    TEMPLATE_CMD_UPDATE,
    TEMPLATE_CMD_DELETE
} from './template.constants';

@Injectable()
export class TemplateEmitter {

    private logger = new AppLogger(TemplateEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, template: TemplateEntity, contents: any
    ): void {
        this.client.send({ cmd: TEMPLATE_CMD_CREATE }, { user, template, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, template: TemplateEntity, contents: any
    ): void {
        this.client.send({ cmd: TEMPLATE_CMD_UPDATE }, { user, template, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, template: TemplateEntity): void {
        this.client.send({ cmd: TEMPLATE_CMD_DELETE }, { user, template })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
