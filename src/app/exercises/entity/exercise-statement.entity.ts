import { Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { FormattedTextEntity } from './formatted-text.entity';
import { ExerciseEntity } from './exercise.entity';

@Entity('exercise-statement')
export class ExerciseStatementEntity extends FormattedTextEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;

    @ManyToOne(type => ExerciseEntity, exercise => exercise.statements)
    @JoinColumn({ name: 'exercise_id' })
    // @Field(type => ExerciseEntity)
    public exercise: ExerciseEntity;
}
