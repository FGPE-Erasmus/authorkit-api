import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToMany, Index } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsEmpty, IsDefined, IsUUID, IsEnum, IsArray, IsString, MaxLength } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity } from '../../../_helpers';
import { RuleActionType } from './rule-action-type.enum';
import { RuleEntity } from './rule.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('gl-rule-action')
export class RuleActionEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => RuleEntity, rule => rule.actions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rule_id' })
    @Column('uuid', { nullable: false })
    @Index()
    @Field()
    public rule_id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsEnum(RuleActionType, { always: true })
    @Column({
        type: 'enum',
        enum: RuleActionType
    })
    public type: RuleActionType;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(150, { always: true, each: true })
    @Column('simple-array', { default: [] })
    public parameters: string[];
}
