import { Injectable, Inject, HttpService } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { AppLogger } from '../app.logger';
import { ExerciseEntity } from './entity/exercise.entity';

@Injectable()
export class ExerciseService extends TypeOrmCrudService<ExerciseEntity> {

    private logger = new AppLogger(ExerciseService.name);

    constructor(
        @InjectRepository(ExerciseEntity) protected readonly repository: Repository<ExerciseEntity>,
        private readonly httpService: HttpService
    ) {
        super(repository);
    }
}
