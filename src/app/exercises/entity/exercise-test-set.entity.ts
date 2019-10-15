import { Column, PrimaryGeneratedColumn, ManyToOne, Entity, PrimaryColumn, JoinColumn, OneToMany } from 'typeorm';
import { Field } from 'type-graphql';

import { ExtendedEntity } from '../../_helpers';
import { ExerciseEntity } from './exercise.entity';
import { ExerciseTestEntity } from './exercise-test.entity';

@Entity('exercise-test-set')
export class ExerciseTestSetEntity extends ExtendedEntity {

    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @PrimaryColumn('uuid')
    @Field()
    public exercise_id: string;

    @Column()
    public name: string;

    @Column()
    public weight: number;

    @Column()
    public visible: boolean;

    @OneToMany(type => ExerciseTestEntity, test => test.test_set, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    @Field(type => [ExerciseTestEntity])
    public tests: ExerciseTestEntity[];

    @ManyToOne(type => ExerciseEntity, exercise => exercise.testSets)
    @JoinColumn({ name: 'exercise_id' })
    // @Field(type => ExerciseEntity)
    public exercise: ExerciseEntity;
}
