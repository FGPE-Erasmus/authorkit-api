import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { FeedbackGeneratorEntity } from './entity/feedback-generator.entity';
import {
    FEEDBACK_GENERATOR_CMD_CREATE,
    FEEDBACK_GENERATOR_CMD_UPDATE,
    FEEDBACK_GENERATOR_CMD_DELETE
} from './feedback-generator.constants';

@Injectable()
export class FeedbackGeneratorEmitter {

    private logger = new AppLogger(FeedbackGeneratorEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, feedback_generator: FeedbackGeneratorEntity, contents: any
    ): void {
        this.client.send({ cmd: FEEDBACK_GENERATOR_CMD_CREATE }, { user, feedback_generator, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, feedback_generator: FeedbackGeneratorEntity, contents: any
    ): void {
        this.client.send({ cmd: FEEDBACK_GENERATOR_CMD_UPDATE }, { user, feedback_generator, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, feedback_generator: FeedbackGeneratorEntity): void {
        this.client.send({ cmd: FEEDBACK_GENERATOR_CMD_DELETE }, { user, feedback_generator })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
