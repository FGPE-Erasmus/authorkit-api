import { Column, PrimaryGeneratedColumn, ManyToOne, Entity, JoinColumn, PrimaryColumn, Index } from 'typeorm';

import { ExtendedEntity } from '../../_helpers';
import { Field } from 'type-graphql';

@Entity('exercise-test')
export class ExerciseTestEntity extends ExtendedEntity {

    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column('uuid')
    @Index()
    @Field()
    public exercise_id: string;

    @Column('uuid', { nullable: true })
    @Index()
    @Field()
    public testset_id: string;

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
}
