import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryColumn, ManyToOne, Column, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Field } from 'type-graphql';
import { IsDefined, IsOptional, IsEmpty, IsUUID } from 'class-validator';

import { CodeEntity } from './code.entity';
import { ExerciseEntity } from './exercise.entity';
import { CrudValidationGroups } from '@nestjsx/crud';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('exercise-solution')
export class ExerciseSolutionEntity extends CodeEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.solutions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: false })
    @Field()
    public exercise_id: string;
}
