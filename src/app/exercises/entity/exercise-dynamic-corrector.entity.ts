import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { ExecutableEntity } from './executable.entity';
import { ExerciseEntity } from './exercise.entity';

@Entity('exercise-dynamic-corrector')
export class ExerciseDynamicCorrectorEntity extends ExecutableEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;

    @ManyToOne(type => ExerciseEntity, exercise => exercise.dynamic_correctors)
    @JoinColumn({ name: 'exercise_id' })
    // @Field(type => ExerciseEntity)
    public exercise: ExerciseEntity;
}
