import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToMany, ManyToMany, JoinTable, RelationId } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsEmpty, IsDefined, IsUUID, IsNotEmpty, IsString, MaxLength, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity } from '../../../_helpers/entity/tracked-file.entity';
import { ExerciseEntity } from '../../../exercises/entity/exercise.entity';
import { RuleEntity } from '../../rules/entity/rule.entity';
import { RewardEntity } from '../../rewards/entity/reward.entity';
import { LeaderboardEntity } from '../../leaderboards/entity/leaderboard.entity';
import { GamificationLayerEntity } from '../../entity/gamification-layer.entity';

import { ChallengeMode } from './challenge-mode.enum';
import { ChallengeDifficulty } from './challenge-difficulty.enum';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('gl-challenge')
export class ChallengeEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => GamificationLayerEntity, gl => gl.challenges, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gl_id' })
    @Column('uuid', { nullable: false })
    @Field()
    public gl_id: string;

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
    @IsEnum(ChallengeMode, { always: true })
    @Column({
        type: 'enum',
        enum: ChallengeMode,
        default: ChallengeMode.NORMAL
    })
    public mode: ChallengeMode;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(150, { always: true, each: true })
    @Column('simple-array', { default: [] })
    public mode_parameters: string[];

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsBoolean({ always: true })
    @Column({
        type: 'boolean',
        default: false
    })
    public locked: Boolean;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsBoolean({ always: true })
    @Column({
        type: 'boolean',
        default: false
    })
    public hidden: Boolean;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsEnum(ChallengeDifficulty, { always: true })
    @Column({
        type: 'enum',
        enum: ChallengeDifficulty,
        default: ChallengeDifficulty.EASY
    })
    public difficulty: ChallengeDifficulty;

    /* @OneToMany(() => FeedbackGeneratorEntity, feedback_generator => feedback_generator.challenge_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [FeedbackGeneratorEntity])
    public feedback_generators: FeedbackGeneratorEntity[]; */

    @OneToMany(() => RuleEntity, rule => rule.challenge_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [RuleEntity])
    public rules: RuleEntity[];

    @OneToMany(() => RewardEntity, reward => reward.challenge_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [RewardEntity])
    public rewards: RewardEntity[];

    @OneToMany(() => LeaderboardEntity, leaderboard => leaderboard.challenge_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [LeaderboardEntity])
    public leaderboards: LeaderboardEntity[];

    /** refs */

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ChallengeEntity, challenge => challenge.sub_challenges, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_challenge_id' })
    @Column('uuid', { nullable: true })
    @Field()
    public parent_challenge_id: string;

    @OneToMany(() => ChallengeEntity, challenge => challenge.parent_challenge_id)
    @Field(() => [ChallengeEntity])
    public sub_challenges: ChallengeEntity[];

    @RelationId((challenge: ChallengeEntity) => challenge.sub_challenges)
    public sub_challenge_ids: string[];

    @ManyToMany(() => ExerciseEntity, exercise => exercise.challenges)
    @JoinTable({
        joinColumn: { name: 'challenge_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'exercise_id', referencedColumnName: 'id' }
    })
    @Field(() => [ExerciseEntity])
    public exercises: ExerciseEntity[];

    @RelationId((challenge: ChallengeEntity) => challenge.exercises)
    public exercise_ids: string[];

    @ManyToMany(() => RewardEntity, reward => reward.unlockable_exercises, { onDelete: 'CASCADE' })
    @Field(() => [RewardEntity])
    public unlocked_by: RewardEntity[];

    @ManyToMany(() => RewardEntity, reward => reward.revealable_exercises, { onDelete: 'CASCADE' })
    @Field(() => [RewardEntity])
    public revealed_by: RewardEntity[];
}
