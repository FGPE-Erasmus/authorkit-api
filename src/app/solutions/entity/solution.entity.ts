import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsEmpty, IsUUID } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { CodeEntity } from '../../_helpers';
import { ExerciseEntity } from '../../exercises/entity/exercise.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('solution')
export class SolutionEntity extends CodeEntity {

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
