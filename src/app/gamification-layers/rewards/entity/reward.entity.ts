import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsEmpty, IsDefined, IsUUID, IsNotEmpty, IsString, MaxLength, IsEnum, IsArray } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity } from '../../../_helpers/entity/tracked-file.entity';
import { ExerciseEntity } from '../../../exercises/entity/exercise.entity';
import { ChallengeEntity } from '../../challenges/entity/challenge.entity';
import { CriteriaEntity } from '../../rules/entity/criteria.entity';
import { GamificationLayerEntity } from '../../entity/gamification-layer.entity';
import { RewardKind } from '../entity/reward-kind.enum';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('gl-reward')
export class RewardEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => GamificationLayerEntity, gl => gl.rewards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gl_id' })
    @Column('uuid', { nullable: true })
    @Field()
    public gl_id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ChallengeEntity, challenge => challenge.rewards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'challenge_id' })
    @Column('uuid', { nullable: true })
    @Field()
    public challenge_id: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNotEmpty({ always: true })
    @IsString({ always: true })
    @MaxLength(150, { always: true })
    @Column('varchar', { length: 150, nullable: false })
    @Field()
    public name: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(500, { always: true })
    @Column('varchar', { length: 500, nullable: true })
    @Field()
    public description: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsEnum(RewardKind, { always: true })
    @Column({
        type: 'enum',
        enum: RewardKind
    })
    public kind: RewardKind;

    @ApiModelProperty()
    @ManyToMany(() => ExerciseEntity)
    @JoinTable()
    @Field(() => [ExerciseEntity])
    public unlockables: ExerciseEntity[];

    @ApiModelProperty()
    @ManyToMany(() => ExerciseEntity)
    @JoinTable()
    @Field(() => [ExerciseEntity])
    public revealables: ExerciseEntity[];

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(250, { always: true, each: true })
    @Column('simple-array', { default: [] })
    public hints: string[];

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(250, { always: true, each: true })
    @Column('simple-array', { default: [] })
    public congratulations: string[];

    @OneToMany(() => CriteriaEntity, criteria => criteria.reward_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [CriteriaEntity])
    public criteria: CriteriaEntity[];
}
