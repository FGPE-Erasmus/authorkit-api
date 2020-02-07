import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity';

import {
    GAMIFICATION_LAYER_CMD_CREATE,
    GAMIFICATION_LAYER_CMD_UPDATE,
    GAMIFICATION_LAYER_CMD_DELETE
} from './gamification-layer.constants';
import { GamificationLayerEntity } from './entity/gamification-layer.entity';

@Injectable()
export class GamificationLayerEmitter {

    private logger = new AppLogger(GamificationLayerEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(user: UserEntity, gamificationLayer: GamificationLayerEntity): void {
        this.client
            .send({ cmd: GAMIFICATION_LAYER_CMD_CREATE }, { user, gamificationLayer })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(user: UserEntity, gamificationLayer: GamificationLayerEntity): void {
        this.client
            .send({ cmd: GAMIFICATION_LAYER_CMD_UPDATE }, { user, gamificationLayer })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, gamificationLayer: GamificationLayerEntity): void {
        this.client
            .send({ cmd: GAMIFICATION_LAYER_CMD_DELETE }, { user, gamificationLayer })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
