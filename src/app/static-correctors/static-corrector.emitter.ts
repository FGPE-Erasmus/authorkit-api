import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { StaticCorrectorEntity } from './entity/static-corrector.entity';
import {
    STATIC_CORRECTOR_CMD_CREATE,
    STATIC_CORRECTOR_CMD_UPDATE,
    STATIC_CORRECTOR_CMD_DELETE
} from './static-corrector.constants';

@Injectable()
export class StaticCorrectorEmitter {

    private logger = new AppLogger(StaticCorrectorEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, static_corrector: StaticCorrectorEntity, contents: any
    ): void {
        this.client.send({ cmd: STATIC_CORRECTOR_CMD_CREATE }, { user, static_corrector, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, static_corrector: StaticCorrectorEntity, contents: any
    ): void {
        this.client.send({ cmd: STATIC_CORRECTOR_CMD_UPDATE }, { user, static_corrector, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, static_corrector: StaticCorrectorEntity): void {
        this.client.send({ cmd: STATIC_CORRECTOR_CMD_DELETE }, { user, static_corrector })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
