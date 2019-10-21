import { Column, PrimaryGeneratedColumn, ManyToOne, Entity, JoinColumn, PrimaryColumn, Index } from 'typeorm';

import { ExtendedEntity } from '../../_helpers';
import { Field } from 'type-graphql';

@Entity('exercise-test')
export class ExerciseTestEntity extends ExtendedEntity {

    @PrimaryGeneratedColumn('uuid')
    @Field()
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
    @Field()
    public input: string;

    @Column()
    @Field()
    public output: string;

    @Column('simple-array', { default: [] })
    @Field(type => [String])
    public arguments: string[];

    @Column()
    @Field()
    public weight: number;

    @Column({ default: false })
    @Field()
    public visible: boolean;
}
