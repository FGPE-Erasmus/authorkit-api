import { Entity, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { ResourceEntity } from './resource.entity';

@Entity('exercise-embeddable')
export class ExerciseEmbeddableEntity extends ResourceEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;
}
