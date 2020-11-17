import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { IsOptional, IsEmpty, IsUUID, IsDefined, IsNotEmpty, IsString, MaxLength, IsArray, IsBoolean } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity } from '../../../_helpers/entity/tracked-file.entity';
import { GamificationLayerEntity } from '../../entity/gamification-layer.entity';
import { ChallengeEntity } from '../../challenges/entity/challenge.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

export type Order = 'ASC' | 'DESC';

@Entity('gl-leaderboard')
export class LeaderboardEntity extends TrackedFileEntity {

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsUUID('4', { always: true })
    @ManyToOne(() => GamificationLayerEntity, gl => gl.leaderboards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gl_id', referencedColumnName: 'id' })
    @Column('uuid', { nullable: false })
    public gl_id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ChallengeEntity, challenge => challenge.leaderboards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'challenge_id', referencedColumnName: 'id' })
    @Column('uuid', { nullable: true })
    public challenge_id: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNotEmpty({ always: true })
    @IsString({ always: true })
    @MaxLength(150, { always: true })
    @Column('varchar', { length: 150, nullable: false })
    public name: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsBoolean({ always: true })
    @Column({
        type: 'boolean',
        default: false
    })
    public groups: boolean;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(50, { always: true, each: true })
    @Column('simple-array', { default: [] })
    public metrics: string[];

    @ApiProperty()
    @IsOptional({ always: true })
    @Column({
        type: 'simple-array',
        enum: ['ASC', 'DESC'],
        default: []
    })
    public sorting_orders: Order[];
}
