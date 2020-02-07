import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../../config';
import { AppLogger } from '../../app.logger';
import { UserEntity } from '../../user/entity/user.entity';

import { CHALLENGE_CMD_CREATE, CHALLENGE_CMD_UPDATE, CHALLENGE_CMD_DELETE } from './challenge.constants';
import { ChallengeEntity } from './entity/challenge.entity';

@Injectable()
export class ChallengeEmitter {

    private logger = new AppLogger(ChallengeEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(user: UserEntity, challenge: ChallengeEntity): void {
        this.client.send({ cmd: CHALLENGE_CMD_CREATE }, { user, challenge })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(user: UserEntity, challenge: ChallengeEntity): void {
        this.client.send({ cmd: CHALLENGE_CMD_UPDATE }, { user, challenge })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, challenge: ChallengeEntity): void {
        this.client.send({ cmd: CHALLENGE_CMD_DELETE }, { user, challenge })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
