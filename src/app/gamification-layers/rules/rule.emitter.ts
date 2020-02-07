import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../../config';
import { AppLogger } from '../../app.logger';
import { UserEntity } from '../../user/entity/user.entity';

import { RULE_CMD_CREATE, RULE_CMD_UPDATE, RULE_CMD_DELETE } from './rule.constants';
import { RuleEntity } from './entity/rule.entity';

@Injectable()
export class RuleEmitter {

    private logger = new AppLogger(RuleEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(user: UserEntity, rule: RuleEntity): void {
        this.client.send({ cmd: RULE_CMD_CREATE }, { user, rule })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(user: UserEntity, rule: RuleEntity): void {
        this.client.send({ cmd: RULE_CMD_UPDATE }, { user, rule })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, rule: RuleEntity): void {
        this.client.send({ cmd: RULE_CMD_DELETE }, { user, rule })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
