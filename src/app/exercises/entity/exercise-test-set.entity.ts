import { Column, PrimaryGeneratedColumn, Entity, OneToMany, Index } from 'typeorm';
import { Field } from 'type-graphql';

import { ExtendedEntity } from '../../_helpers';
import { ExerciseTestEntity } from './exercise-test.entity';

@Entity('exercise-test-set')
export class ExerciseTestSetEntity extends ExtendedEntity {

    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @Column('uuid')
    @Index()
    @Field()
    public exercise_id: string;

    @Column()
    public name: string;

    @Column()
    public weight: number;

    @Column()
    public visible: boolean;

    @OneToMany(type => ExerciseTestEntity, test => test.testset_id, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    @Field(type => [ExerciseTestEntity])
    public tests: ExerciseTestEntity[];
}
