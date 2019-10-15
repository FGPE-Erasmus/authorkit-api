import { Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { ResourceEntity } from './resource.entity';
import { ExerciseEntity } from './exercise.entity';

@Entity('exercise-embeddable')
export class ExerciseEmbeddableEntity extends ResourceEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;

    @ManyToOne(type => ExerciseEntity, exercise => exercise.embeddables)
    @JoinColumn({ name: 'exercise_id' })
    // @Field(type => ExerciseEntity)
    public exercise: ExerciseEntity;
}
