import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { SolutionEntity } from './entity/solution.entity';
import {
    SOLUTION_CMD_CREATE,
    SOLUTION_CMD_UPDATE,
    SOLUTION_CMD_DELETE
} from './solution.constants';

@Injectable()
export class SolutionEmitter {

    private logger = new AppLogger(SolutionEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, solution: SolutionEntity, contents: any
    ): void {
        this.client.send({ cmd: SOLUTION_CMD_CREATE }, { user, solution, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, solution: SolutionEntity, contents: any
    ): void {
        this.client.send({ cmd: SOLUTION_CMD_UPDATE }, { user, solution, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, solution: SolutionEntity): void {
        this.client.send({ cmd: SOLUTION_CMD_DELETE }, { user, solution })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
