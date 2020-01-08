import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsEmpty, IsUUID, IsDefined, IsNotEmpty, IsString, MaxLength, IsArray, Validate, ValidateIf } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity } from '../../../_helpers/entity/tracked-file.entity';
import { NotSiblingOf } from '../../../_helpers/validators';
import { GamificationLayerEntity } from '../../entity/gamification-layer.entity';
import { ChallengeEntity } from '../../challenges/entity/challenge.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

export type Order = 'ASC' | 'DESC';

@Entity('gl-leaderboard')
export class LeaderboardEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @ValidateIf(o => !o.challenge_id || o.gl_id, { always: true })
    @IsDefined({ groups: [CREATE] })
    @NotSiblingOf(['challenge_id'], { always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => GamificationLayerEntity, gl => gl.leaderboards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gl_id', referencedColumnName: 'id' })
    @Column('uuid', { nullable: true })
    @Field()
    public gl_id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @ValidateIf(o => !o.gl_id || o.challenge_id, { always: true })
    @IsDefined({ groups: [CREATE] })
    @NotSiblingOf(['gl_id'], { always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ChallengeEntity, challenge => challenge.leaderboards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'challenge_id', referencedColumnName: 'id' })
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
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(50, { always: true, each: true })
    @Column('simple-array', { default: [] })
    public metrics: string[];

    @ApiModelProperty()
    @IsOptional({ always: true })
    @Column({
        type: 'simple-array',
        enum: ['ASC', 'DESC'],
        default: []
    })
    @Field(() => [String])
    public sorting_orders: Order[];
}
