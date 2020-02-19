import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { DynamicCorrectorEntity } from './entity/dynamic-corrector.entity';
import {
    DYNAMIC_CORRECTOR_CMD_CREATE,
    DYNAMIC_CORRECTOR_CMD_UPDATE,
    DYNAMIC_CORRECTOR_CMD_DELETE
} from './dynamic-corrector.constants';

@Injectable()
export class DynamicCorrectorEmitter {

    private logger = new AppLogger(DynamicCorrectorEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, dynamic_corrector: DynamicCorrectorEntity, contents: any
    ): void {
        this.client.send({ cmd: DYNAMIC_CORRECTOR_CMD_CREATE }, { user, dynamic_corrector, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, dynamic_corrector: DynamicCorrectorEntity, contents: any
    ): void {
        this.client.send({ cmd: DYNAMIC_CORRECTOR_CMD_UPDATE }, { user, dynamic_corrector, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, dynamic_corrector: DynamicCorrectorEntity): void {
        this.client.send({ cmd: DYNAMIC_CORRECTOR_CMD_DELETE }, { user, dynamic_corrector })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
