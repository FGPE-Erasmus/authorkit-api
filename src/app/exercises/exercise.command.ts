import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Command, Positional } from 'nestjs-command';
import faker from 'faker';

import { AppLogger } from '../app.logger';
import { ExerciseEntity } from './entity';
import { Repository } from 'typeorm';

@Injectable()
export class ExerciseCommand {

    private logger = new AppLogger(ExerciseCommand.name);

    constructor(
        @InjectRepository(ExerciseEntity) private readonly exerciseRepository: Repository<ExerciseEntity>
    ) {
        faker.locale = 'en_US';
    }

    @Command({ command: 'create:exercise [amount]', describe: 'create random fake exercises' })
    public async create(@Positional({ name: 'amount' }) amount): Promise<void> {
    }
}
