import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../../config';
import { AppLogger } from '../../app.logger';
import { UserEntity } from '../../user/entity/user.entity';

import { LEADERBOARD_CMD_CREATE, LEADERBOARD_CMD_UPDATE, LEADERBOARD_CMD_DELETE } from './leaderboard.constants';
import { LeaderboardEntity } from './entity/leaderboard.entity';

@Injectable()
export class LeaderboardEmitter {

    private logger = new AppLogger(LeaderboardEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(user: UserEntity, leaderboard: LeaderboardEntity): void {
        this.client.send({ cmd: LEADERBOARD_CMD_CREATE }, { user, leaderboard })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(user: UserEntity, leaderboard: LeaderboardEntity): void {
        this.client.send({ cmd: LEADERBOARD_CMD_UPDATE }, { user, leaderboard })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, leaderboard: LeaderboardEntity): void {
        this.client.send({ cmd: LEADERBOARD_CMD_DELETE }, { user, leaderboard })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
