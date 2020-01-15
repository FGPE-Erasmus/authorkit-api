import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsEmpty, IsDefined, IsUUID } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity } from '../../../_helpers/entity/tracked-file.entity';
import { RewardEntity } from '../../rewards/entity/reward.entity';
import { ConditionEntity } from './condition.entity';
import { RuleEntity } from './rule.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

export type Junctor = 'AND' | 'OR';

export class CriteriaEntity {/*  extends TrackedFileEntity

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @OneToOne(() => RuleEntity, r => r.criteria, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rule_id' })
    @Column('uuid', { nullable: true })
    @Field()
    public rule_id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @OneToOne(() => RewardEntity, r => r.criteria, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'reward_id' })
    @Column('uuid', { nullable: true })
    @Field()
    public reward_id: string; */

    /* @ApiModelProperty()
    @IsOptional({ always: true })
    @OneToMany(() => ConditionEntity, condition => condition.criteria_id, {
        cascade: ['insert', 'update', 'remove'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        eager: true
    })
    @Field(() => [ConditionEntity]) */
    @ApiModelProperty()
    @IsOptional({ always: true })
    @Column('simple-json', { nullable: true })
    @Field(() => [ConditionEntity])
    public conditions: ConditionEntity[];

    @ApiModelProperty()
    @IsOptional({ always: true })
    @Column({
        type: 'simple-array',
        enum: ['AND', 'OR'],
        default: []
    })
    @Field(() => [String])
    public junctors: Junctor[];
}
