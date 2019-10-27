import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsEmpty, IsDefined, IsUUID } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ResourceEntity } from './resource.entity';
import { ExerciseEntity } from './exercise.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('exercise-embeddable')
export class ExerciseEmbeddableEntity extends ResourceEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.embeddables, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: false })
    @Field()
    public exercise_id: string;
}
