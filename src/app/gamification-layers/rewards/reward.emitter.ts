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

    public sendCreate(reward: RewardEntity): void {
        this.client.send({ cmd: REWARD_CMD_CREATE }, reward)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(reward: RewardEntity): void {
        this.client.send({ cmd: REWARD_CMD_UPDATE }, reward)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(reward: RewardEntity): void {
        this.client.send({ cmd: REWARD_CMD_DELETE }, reward)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
