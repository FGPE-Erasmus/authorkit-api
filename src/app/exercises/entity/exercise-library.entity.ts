import { Entity, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { ResourceEntity } from './resource.entity';

@Entity('exercise-library')
export class ExerciseLibraryEntity extends ResourceEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;
}
