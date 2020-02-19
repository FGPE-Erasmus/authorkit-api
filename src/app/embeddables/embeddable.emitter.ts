import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { EmbeddableEntity } from './entity/embeddable.entity';
import {
    EMBEDDABLE_CMD_CREATE,
    EMBEDDABLE_CMD_UPDATE,
    EMBEDDABLE_CMD_DELETE
} from './embeddable.constants';

@Injectable()
export class EmbeddableEmitter {

    private logger = new AppLogger(EmbeddableEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, embeddable: EmbeddableEntity, contents: any
    ): void {
        this.client.send({ cmd: EMBEDDABLE_CMD_CREATE }, { user, embeddable, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, embeddable: EmbeddableEntity, contents: any
    ): void {
        this.client.send({ cmd: EMBEDDABLE_CMD_UPDATE }, { user, embeddable, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, embeddable: EmbeddableEntity): void {
        this.client.send({ cmd: EMBEDDABLE_CMD_DELETE }, { user, embeddable })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
