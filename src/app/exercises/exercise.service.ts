import { Injectable, Inject, HttpService } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';

import { CrudService } from '../../base';
import { AppLogger } from '../app.logger';
import { UserService } from '../user/user.service';
import { ProjectUserService } from '../project-user/project-user.service';
import { ExerciseEntity } from './entity/exercise.entity';
import { EXERCISE_TOKEN } from './exercise.constants';

@Injectable()
export class ExerciseService extends CrudService<ExerciseEntity> {

    private logger = new AppLogger(ExerciseService.name);

    constructor(
        @Inject(EXERCISE_TOKEN) protected readonly repository: Repository<ExerciseEntity>,
        private readonly httpService: HttpService,
        private readonly userService: UserService,
        private readonly projectUserService: ProjectUserService
    ) {
        super();
    }
}
