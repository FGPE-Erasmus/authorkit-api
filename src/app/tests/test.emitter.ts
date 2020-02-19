import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { TestEntity } from './entity/test.entity';
import {
    TEST_CMD_CREATE,
    TEST_CMD_UPDATE,
    TEST_CMD_DELETE,
    TEST_INPUT_CMD_CREATE,
    TEST_INPUT_CMD_UPDATE,
    TEST_OUTPUT_CMD_CREATE,
    TEST_OUTPUT_CMD_UPDATE
} from './test.constants';

@Injectable()
export class TestEmitter {

    private logger = new AppLogger(TestEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, test: TestEntity, input: any, output: any
    ): void {
        this.client.send({ cmd: TEST_CMD_CREATE }, { user, test, input, output })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, test: TestEntity, input: any, output: any
    ): void {
        this.client.send({ cmd: TEST_CMD_UPDATE }, { user, test, input, output })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, test: TestEntity): void {
        this.client.send({ cmd: TEST_CMD_DELETE }, { user, test })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendInputCreate(user: UserEntity, test: TestEntity, content: any): void {
        this.client.send({ cmd: TEST_INPUT_CMD_CREATE }, { user, test, content })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendInputUpdate(user: UserEntity, test: TestEntity, content: any): void {
        this.client.send({ cmd: TEST_INPUT_CMD_UPDATE }, { user, test, content })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendOutputCreate(user: UserEntity, test: TestEntity, content: any): void {
        this.client.send({ cmd: TEST_OUTPUT_CMD_CREATE }, { user, test, content })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendOutputUpdate(user: UserEntity, test: TestEntity, content: any): void {
        this.client.send({ cmd: TEST_OUTPUT_CMD_UPDATE }, { user, test, content })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
