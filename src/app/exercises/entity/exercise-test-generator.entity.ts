import { Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { ExecutableEntity } from './executable.entity';
import { ExerciseEntity } from './exercise.entity';

@Entity('exercise-test-generator')
export class ExerciseTestGeneratorEntity extends ExecutableEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;

    @ManyToOne(type => ExerciseEntity, exercise => exercise.test_generators)
    @JoinColumn({ name: 'exercise_id' })
    // @Field(type => ExerciseEntity)
    public exercise: ExerciseEntity;
}
