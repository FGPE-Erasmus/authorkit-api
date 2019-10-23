import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsEmpty, IsDefined, IsUUID } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ExecutableEntity } from './executable.entity';
import { ExerciseEntity } from './exercise.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('exercise-dynamic-corrector')
export class ExerciseDynamicCorrectorEntity extends ExecutableEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.dynamic_correctors)
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: false })
    @Field()
    public exercise_id: string;
}
