import { Column, PrimaryGeneratedColumn, ManyToOne, Entity, JoinColumn, PrimaryColumn } from 'typeorm';

import { ExtendedEntity } from '../../_helpers';
import { ExerciseEntity } from './exercise.entity';
import { Field } from 'type-graphql';
import { ExerciseTestSetEntity } from './exercise-test-set.entity';

@Entity('exercise-test')
export class ExerciseTestEntity extends ExtendedEntity {

    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;

    @Column()
    public input: string;

    @Column()
    public output: string;

    @Column('simple-array', { default: [] })
    public arguments: string[];

    @Column()
    public weight: number;

    @Column({ default: false })
    public visible: boolean;

    @ManyToOne(type => ExerciseTestSetEntity, test_set => test_set.tests)
    @Field(type => ExerciseTestSetEntity)
    public test_set: ExerciseTestSetEntity;

    @ManyToOne(type => ExerciseEntity, exercise => exercise.tests)
    @JoinColumn({ name: 'exercise_id' })
    // @Field(type => ExerciseEntity)
    public exercise: ExerciseEntity;
}
