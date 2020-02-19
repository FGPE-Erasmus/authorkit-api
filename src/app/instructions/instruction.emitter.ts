import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { InstructionEntity } from './entity/instruction.entity';
import {
    INSTRUCTION_CMD_CREATE,
    INSTRUCTION_CMD_UPDATE,
    INSTRUCTION_CMD_DELETE
} from './instruction.constants';

@Injectable()
export class InstructionEmitter {

    private logger = new AppLogger(InstructionEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, instruction: InstructionEntity, contents: any
    ): void {
        this.client.send({ cmd: INSTRUCTION_CMD_CREATE }, { user, instruction, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, instruction: InstructionEntity, contents: any
    ): void {
        this.client.send({ cmd: INSTRUCTION_CMD_UPDATE }, { user, instruction, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, instruction: InstructionEntity): void {
        this.client.send({ cmd: INSTRUCTION_CMD_DELETE }, { user, instruction })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
