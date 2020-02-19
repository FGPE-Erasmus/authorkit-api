import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { config } from '../../config';
import { UserEntity } from '../user/entity/user.entity';

import { EXERCISE_CMD_CREATE, EXERCISE_CMD_UPDATE, EXERCISE_CMD_DELETE } from './exercise.constants';
import { ExerciseEntity } from './entity/exercise.entity';

@Injectable()
export class ExerciseEmitter {

    private logger = new AppLogger(ExerciseEmitter.name);

    @Client({
        transport: Transport.TCP,
        options: config.microservice.options
    })
    private client: ClientProxy;

    constructor() { }

    public sendCreate(user: UserEntity, exercise: ExerciseEntity): void {
        this.client.send({ cmd: EXERCISE_CMD_CREATE }, { user, exercise })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(user: UserEntity, exercise: ExerciseEntity): void {
        this.client.send({ cmd: EXERCISE_CMD_UPDATE }, { user, exercise })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(user: UserEntity, exercise: ExerciseEntity): void {
        this.client.send({ cmd: EXERCISE_CMD_DELETE }, { user, exercise })
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
