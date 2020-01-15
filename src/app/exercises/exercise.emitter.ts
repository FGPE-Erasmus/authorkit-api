import { Injectable } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';

import { AppLogger } from '../app.logger';
import { config } from '../../config';

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

    public sendCreate(exercise: ExerciseEntity): void {
        this.client.send({ cmd: EXERCISE_CMD_CREATE }, exercise)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendUpdate(exercise: ExerciseEntity): void {
        this.client.send({ cmd: EXERCISE_CMD_UPDATE }, exercise)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }

    public sendDelete(exercise: ExerciseEntity): void {
        this.client.send({ cmd: EXERCISE_CMD_DELETE }, exercise)
            .subscribe(() => { }, error => {
                this.logger.error(error, '');
            });
    }
}
