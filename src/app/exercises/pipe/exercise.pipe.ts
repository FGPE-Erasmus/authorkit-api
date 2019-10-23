import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ExerciseService } from '../exercise.service';
import { ExerciseEntity } from '../entity';

@Injectable()
export class ExercisePipe implements PipeTransform<any> {

    constructor(private readonly exerciseService: ExerciseService) {
    }

    async transform(exerciseId: string, metadata: ArgumentMetadata): Promise<ExerciseEntity> {
        return this.exerciseService.findOne(exerciseId);
    }
}
