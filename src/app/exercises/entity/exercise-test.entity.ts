import { Column, PrimaryGeneratedColumn, ManyToOne, Entity, JoinColumn, Index } from 'typeorm';
import { Field } from 'type-graphql';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsEmpty, IsDefined, IsUUID, MinLength, IsString, IsNumber, Max, Min, IsBoolean } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ExtendedEntity } from '../../_helpers';
import { ExerciseEntity } from './exercise.entity';
import { ResourceEntity } from '../../_helpers';
import { ExerciseTestSetEntity } from './exercise-test-set.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('exercise-test')
export class ExerciseTestEntity extends ExtendedEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.tests, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: false })
    @Index()
    @Field()
    public exercise_id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseTestSetEntity, testset => testset.tests, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'testset_id' })
    @Column('uuid', { nullable: true })
    @Index()
    @Field()
    public testset_id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @Column('simple-json', { nullable: true })
    @Field(() => ResourceEntity)
    public input: ResourceEntity;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @Column('simple-json', { nullable: true })
    @Field(() => ResourceEntity)
    public output: ResourceEntity;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ each: true, always: true })
    @Column('simple-array')
    @Field(() => [String])
    public arguments: string[] = [];

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { always: true })
    @Max(100, { always: true })
    @Min(0, { always: true })
    @Column('real', { nullable: false })
    @Field()
    public weight: number;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsBoolean({ always: true })
    @Column('boolean', { default: true })
    @Field()
    public visible: boolean;
}
