import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { config } from '../../config';
import { UserEntity } from '../user/entity/user.entity';
import { TestSetEntity } from './entity/testset.entity';

import {
    TESTSET_CMD_CREATE,
    TESTSET_CMD_UPDATE,
    TESTSET_CMD_DELETE
} from './testset.constants';

@Injectable()
export class TestSetEmitter {

    private logger = new AppLogger(TestSetEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(user: UserEntity, testset: TestSetEntity): void {
        this.client.send({ cmd: TESTSET_CMD_CREATE }, { user, testset })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(user: UserEntity, testset: TestSetEntity): void {
        this.client.send({ cmd: TESTSET_CMD_UPDATE }, { user, testset })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, testset: TestSetEntity): void {
        this.client.send({ cmd: TESTSET_CMD_DELETE }, { user, testset })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
