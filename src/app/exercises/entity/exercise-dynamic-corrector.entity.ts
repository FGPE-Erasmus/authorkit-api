import { Entity, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { ExecutableEntity } from './executable.entity';

@Entity('exercise-dynamic-corrector')
export class ExerciseDynamicCorrectorEntity extends ExecutableEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;
}
