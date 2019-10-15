import { Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { ExecutableEntity } from './executable.entity';
import { ExerciseEntity } from './exercise.entity';

@Entity('exercise-feedback-generator')
export class ExerciseFeedbackGeneratorEntity extends ExecutableEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;

    @ManyToOne(type => ExerciseEntity, exercise => exercise.feedback_generators)
    @JoinColumn({ name: 'exercise_id' })
    // @Field(type => ExerciseEntity)
    public exercise: ExerciseEntity;
}
