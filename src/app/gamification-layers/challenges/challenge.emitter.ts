import { MessagePattern, Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../../config';
import { AppLogger } from '../../app.logger';

import { CHALLENGE_CMD_CREATE, CHALLENGE_CMD_UPDATE, CHALLENGE_CMD_DELETE } from './challenge.constants';
import { ChallengeEntity } from './entity/challenge.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChallengeEmitter {

    private logger = new AppLogger(ChallengeEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(challenge: ChallengeEntity): void {
        this.client.send({ cmd: CHALLENGE_CMD_CREATE }, challenge)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(challenge: ChallengeEntity): void {
        this.client.send({ cmd: CHALLENGE_CMD_UPDATE }, challenge)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(challenge: ChallengeEntity): void {
        this.client.send({ cmd: CHALLENGE_CMD_DELETE }, challenge)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
