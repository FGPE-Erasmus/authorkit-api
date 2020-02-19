import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';

import { LibraryEntity } from './entity/library.entity';
import {
    LIBRARY_CMD_CREATE,
    LIBRARY_CMD_UPDATE,
    LIBRARY_CMD_DELETE
} from './library.constants';

@Injectable()
export class LibraryEmitter {

    private logger = new AppLogger(LibraryEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(
        user: UserEntity, library: LibraryEntity, contents: any
    ): void {
        this.client.send({ cmd: LIBRARY_CMD_CREATE }, { user, library, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(
        user: UserEntity, library: LibraryEntity, contents: any
    ): void {
        this.client.send({ cmd: LIBRARY_CMD_UPDATE }, { user, library, contents })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, library: LibraryEntity): void {
        this.client.send({ cmd: LIBRARY_CMD_DELETE }, { user, library })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
