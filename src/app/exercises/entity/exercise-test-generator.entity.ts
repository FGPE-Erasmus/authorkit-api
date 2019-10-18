import { Entity,  PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { ExecutableEntity } from './executable.entity';

@Entity('exercise-test-generator')
export class ExerciseTestGeneratorEntity extends ExecutableEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;
}
