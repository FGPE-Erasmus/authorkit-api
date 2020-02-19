import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { TestGeneratorEntity } from './entity/test-generator.entity';
import {
    TEST_GENERATOR_CMD_CREATE,
    TEST_GENERATOR_CMD_UPDATE,
    TEST_GENERATOR_CMD_DELETE
} from './test-generator.constants';

@Injectable()
export class TestGeneratorEmitter {

    private logger = new AppLogger(TestGeneratorEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, test_generator: TestGeneratorEntity, contents: any
    ): void {
        this.client.send({ cmd: TEST_GENERATOR_CMD_CREATE }, { user, test_generator, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, test_generator: TestGeneratorEntity, contents: any
    ): void {
        this.client.send({ cmd: TEST_GENERATOR_CMD_UPDATE }, { user, test_generator, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, test_generator: TestGeneratorEntity): void {
        this.client.send({ cmd: TEST_GENERATOR_CMD_DELETE }, { user, test_generator })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
