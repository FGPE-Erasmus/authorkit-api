import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../../config';
import { AppLogger } from '../../app.logger';

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

    public sendCreate(rule: RuleEntity): void {
        this.client.send({ cmd: RULE_CMD_CREATE }, rule)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(rule: RuleEntity): void {
        this.client.send({ cmd: RULE_CMD_UPDATE }, rule)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(rule: RuleEntity): void {
        this.client.send({ cmd: RULE_CMD_DELETE }, rule)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
