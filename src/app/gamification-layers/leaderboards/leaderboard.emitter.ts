import { MessagePattern, Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../../config';
import { AppLogger } from '../../app.logger';

import { LEADERBOARD_CMD_CREATE, LEADERBOARD_CMD_UPDATE, LEADERBOARD_CMD_DELETE } from './leaderboard.constants';
import { LeaderboardEntity } from './entity/leaderboard.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LeaderboardEmitter {

    private logger = new AppLogger(LeaderboardEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(challenge: LeaderboardEntity): void {
        this.client.send({ cmd: LEADERBOARD_CMD_CREATE }, challenge)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(challenge: LeaderboardEntity): void {
        this.client.send({ cmd: LEADERBOARD_CMD_UPDATE }, challenge)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(challenge: LeaderboardEntity): void {
        this.client.send({ cmd: LEADERBOARD_CMD_DELETE }, challenge)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
