import { Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';

import { ResourceEntity } from './resource.entity';
import { ExerciseEntity } from './exercise.entity';
import { Field } from 'type-graphql';

@Entity('exercise-library')
export class ExerciseLibraryEntity extends ResourceEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;

    @ManyToOne(type => ExerciseEntity, exercise => exercise.libraries)
    @JoinColumn({ name: 'exercise_id' })
    // @Field(type => ExerciseEntity)
    public exercise: ExerciseEntity;
}
