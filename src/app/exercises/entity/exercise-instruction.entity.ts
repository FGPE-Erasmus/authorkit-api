import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsDefined, IsEmpty, IsUUID } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { FormattedTextEntity } from '../../_helpers';
import { ExerciseEntity } from './exercise.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('exercise-instruction')
export class ExerciseInstructionEntity extends FormattedTextEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.instructions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: false })
    @Field()
    public exercise_id: string;
}
