import { Entity, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { CodeEntity } from './code.entity';

@Entity('exercise-solution')
export class ExerciseSolutionEntity extends CodeEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;
}
