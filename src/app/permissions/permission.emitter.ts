import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { config } from '../../config';

import { PERMISSION_CMD_SET, PERMISSION_CMD_REVOKE } from './permission.constants';
import { PermissionEntity } from './entity/permission.entity';

@Injectable()
export class PermissionEmitter {

    private logger = new AppLogger(PermissionEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendShare(permission: PermissionEntity): void {
        this.client.send({ cmd: PERMISSION_CMD_SET }, permission)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendRevoke(permission: PermissionEntity): void {
        this.client.send({ cmd: PERMISSION_CMD_REVOKE }, permission)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
