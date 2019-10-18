import { Entity, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { CodeEntity } from './code.entity';

@Entity('exercise-skeleton')
export class ExerciseSkeletonEntity extends CodeEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;
}
