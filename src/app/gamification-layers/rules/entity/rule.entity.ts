import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToMany } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsEmpty, IsDefined, IsUUID } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ExecutableEntity } from '../../../_helpers/entity/executable.entity';
import { ChallengeEntity } from '../../challenges/entity/challenge.entity';
import { CriteriaEntity } from './criteria.entity';
import { GamificationLayerEntity } from '../../entity/gamification-layer.entity';
import { RuleActionEntity } from './rule-action.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('gl-rule')
export class RuleEntity extends ExecutableEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => GamificationLayerEntity, gl => gl.rules, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gl_id' })
    @Column('uuid', { nullable: true })
    @Field()
    public gl_id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ChallengeEntity, challenge => challenge.rules, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'challenge_id' })
    @Column('uuid', { nullable: true })
    @Field()
    public challenge_id: string;

    @OneToMany(() => CriteriaEntity, criteria => criteria.rule_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [CriteriaEntity])
    public criteria: CriteriaEntity[];

    @OneToMany(() => RuleActionEntity, action => action.rule_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [RuleActionEntity])
    public actions: RuleActionEntity[];
}
