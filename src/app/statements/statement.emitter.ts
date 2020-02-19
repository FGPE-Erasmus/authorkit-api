import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { StatementEntity } from './entity/statement.entity';
import {
    STATEMENT_CMD_CREATE,
    STATEMENT_CMD_UPDATE,
    STATEMENT_CMD_DELETE
} from './statement.constants';

@Injectable()
export class StatementEmitter {

    private logger = new AppLogger(StatementEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, statement: StatementEntity, contents: any
    ): void {
        this.client.send({ cmd: STATEMENT_CMD_CREATE }, { user, statement, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, statement: StatementEntity, contents: any
    ): void {
        this.client.send({ cmd: STATEMENT_CMD_UPDATE }, { user, statement, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, statement: StatementEntity): void {
        this.client.send({ cmd: STATEMENT_CMD_DELETE }, { user, statement })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
