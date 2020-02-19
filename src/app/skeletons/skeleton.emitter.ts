import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { SkeletonEntity } from './entity/skeleton.entity';
import {
    SKELETON_CMD_CREATE,
    SKELETON_CMD_UPDATE,
    SKELETON_CMD_DELETE
} from './skeleton.constants';

@Injectable()
export class SkeletonEmitter {

    private logger = new AppLogger(SkeletonEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, skeleton: SkeletonEntity, contents: any
    ): void {
        this.client.send({ cmd: SKELETON_CMD_CREATE }, { user, skeleton, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, skeleton: SkeletonEntity, contents: any
    ): void {
        this.client.send({ cmd: SKELETON_CMD_UPDATE }, { user, skeleton, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, skeleton: SkeletonEntity): void {
        this.client.send({ cmd: SKELETON_CMD_DELETE }, { user, skeleton })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
