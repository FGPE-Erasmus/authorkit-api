import { Entity, PrimaryColumn, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Field } from 'type-graphql';
import { IsDefined, IsOptional, IsEmpty, IsUUID } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';

import { CodeEntity } from '../../_helpers';
import { ExerciseEntity } from './exercise.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('exercise-template')
export class ExerciseTemplateEntity extends CodeEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.templates, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: false })
    @Field()
    public exercise_id: string;
}
