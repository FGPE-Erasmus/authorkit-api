import { Entity,  PrimaryColumn, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Field } from 'type-graphql';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsEmpty, IsOptional, IsDefined, IsUUID } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ExecutableEntity } from './executable.entity';
import { ExerciseEntity } from './exercise.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('exercise-test-generator')
export class ExerciseTestGeneratorEntity extends ExecutableEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.test_generators, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: false })
    @Field()
    public exercise_id: string;
}
