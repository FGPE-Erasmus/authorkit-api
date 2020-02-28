import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { CrudValidationGroups } from '@nestjsx/crud';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsEmpty, IsDefined, IsNotEmpty, IsString, MaxLength, IsUUID, IsArray, IsEnum } from 'class-validator';
import { Field } from 'type-graphql';

import { TrackedFileEntity } from '../../_helpers/entity/tracked-file.entity';
import { UserEntity } from '../../user/entity/user.entity';
import { ProjectEntity } from '../../project/entity/project.entity';
import { ChallengeEntity } from '../challenges/entity/challenge.entity';
import { RuleEntity } from '../rules/entity/rule.entity';
import { RewardEntity } from '../rewards/entity/reward.entity';
import { LeaderboardEntity } from '../leaderboards/entity/leaderboard.entity';

import { FeedbackGeneratorEntity } from '../../feedback-generators/entity/feedback-generator.entity';
import { GamificationLayerStatus } from './gamification-layer-status.enum';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('gl')
export class GamificationLayerEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

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
    @IsUUID('4', { always: true })
    @ManyToOne(() => UserEntity, user => user.id)
    @JoinColumn({ name: 'owner_id' })
    @Column('uuid', { nullable: false })
    public owner_id: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNotEmpty({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ProjectEntity, project => project.gamification_layers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    @Column('uuid', { nullable: false })
    public project_id: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(50, { always: true, each: true })
    @Column('simple-array', { default: [] })
    public keywords: string[];

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsEnum(GamificationLayerStatus, { always: true })
    @Column({
        type: 'varchar',
        length: 15,
        default: GamificationLayerStatus.DRAFT
    })
    public status: string;

    @OneToMany(() => ChallengeEntity, challenge => challenge.gl_id)
    @Field(() => [ChallengeEntity])
    public challenges: ChallengeEntity[];

    @OneToMany(() => RuleEntity, rule => rule.gl_id)
    @Field(() => [RuleEntity])
    public rules: RuleEntity[];

    @OneToMany(() => RewardEntity, reward => reward.gl_id)
    @Field(() => [RewardEntity])
    public rewards: RewardEntity[];

    @OneToMany(() => LeaderboardEntity, leaderboard => leaderboard.gl_id)
    @Field(() => [LeaderboardEntity])
    public leaderboards: LeaderboardEntity[];

    @OneToMany(() => FeedbackGeneratorEntity, fg => fg.gl_id)
    @Field(() => [FeedbackGeneratorEntity])
    public feedback_generators: FeedbackGeneratorEntity[];
}
