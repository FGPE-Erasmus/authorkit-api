import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../../config';
import { AppLogger } from '../../app.logger';

import { REWARD_CMD_CREATE, REWARD_CMD_UPDATE, REWARD_CMD_DELETE } from './reward.constants';
import { RewardEntity } from './entity/reward.entity';

@Injectable()
export class RewardEmitter {

    private logger = new AppLogger(RewardEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(challenge: RewardEntity): void {
        this.client.send({ cmd: REWARD_CMD_CREATE }, challenge)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(challenge: RewardEntity): void {
        this.client.send({ cmd: REWARD_CMD_UPDATE }, challenge)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(challenge: RewardEntity): void {
        this.client.send({ cmd: REWARD_CMD_DELETE }, challenge)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
