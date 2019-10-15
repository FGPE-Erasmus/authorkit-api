import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';

import { CodeEntity } from './code.entity';
import { ExerciseEntity } from './exercise.entity';
import { Field } from 'type-graphql';

@Entity('exercise-template')
export class ExerciseTemplateEntity extends CodeEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;

    @ManyToOne(type => ExerciseEntity, exercise => exercise.templates)
    @JoinColumn({ name: 'exercise_id' })
    // @Field(type => ExerciseEntity)
    public exercise: ExerciseEntity;
}
