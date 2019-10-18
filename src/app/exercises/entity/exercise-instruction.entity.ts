import { Entity, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';

import { FormattedTextEntity } from './formatted-text.entity';

@Entity('exercise-instruction')
export class ExerciseInstructionEntity extends FormattedTextEntity {

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;
}
