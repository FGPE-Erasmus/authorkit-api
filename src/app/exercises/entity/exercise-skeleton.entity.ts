import { Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { CodeEntity } from './code.entity';
import { ExerciseEntity } from './exercise.entity';

@Entity('exercise-skeleton')
export class ExerciseSkeletonEntity extends CodeEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;

    @ManyToOne(type => ExerciseEntity, exercise => exercise.skeletons)
    @JoinColumn({ name: 'exercise_id' })
    // @Field(type => ExerciseEntity)
    public exercise: ExerciseEntity;
}
