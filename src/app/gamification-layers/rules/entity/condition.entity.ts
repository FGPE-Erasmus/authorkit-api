import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToMany } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsEmpty, IsDefined, IsUUID, IsNotEmpty, IsString, MaxLength, IsArray, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity } from '../../../_helpers/entity/tracked-file.entity';
import { ConditionCompFunction } from './condition-comp-function.enum';
import { CriteriaEntity } from './criteria.entity';
import { ConditionSubject } from './condition-subject.enum';

const { CREATE, UPDATE } = CrudValidationGroups;

export class ConditionEntity /* extends TrackedFileEntity  */{

    /* @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => CriteriaEntity, criteria => criteria.conditions, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'criteria_id' })
    @Column('uuid', { nullable: false })
    @Field()
    public criteria_id: string; */

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { always: true })
    @Column('integer', { nullable: false, default: 0 })
    public order: number;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsEnum(ConditionSubject, { always: true })
    @Column({
        type: 'enum',
        enum: ConditionSubject
    })
    public left_entity: ConditionSubject;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNotEmpty({ always: true })
    @IsString({ always: true })
    @MaxLength(150, { always: true })
    @Column('varchar', { length: 150, nullable: false })
    @Field()
    public left_property: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsEnum(ConditionCompFunction, { always: true })
    @Column({
        type: 'enum',
        enum: ConditionCompFunction
    })
    public comparing_function: ConditionCompFunction;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsEnum(ConditionSubject, { always: true })
    @Column({
        type: 'enum',
        enum: ConditionSubject
    })
    public right_entity: ConditionSubject;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(150, { always: true })
    @Column('varchar', { length: 150 })
    @Field()
    public right_property: string;
}
