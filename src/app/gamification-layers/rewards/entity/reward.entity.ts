import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToMany, ManyToMany, JoinTable, OneToOne, RelationId } from 'typeorm';
import { IsOptional, IsEmpty, IsDefined, IsUUID, IsNotEmpty, IsString, MaxLength, IsEnum, IsArray, IsNumber, IsBoolean, IsDataURI } from 'class-validator';
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

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => GamificationLayerEntity, gl => gl.rewards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gl_id' })
    @Column('uuid', { nullable: false })
    public gl_id?: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ChallengeEntity, challenge => challenge.rewards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'challenge_id' })
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
    @IsString({ always: true })
    @MaxLength(500, { always: true })
    @Column('varchar', { length: 500, nullable: true })
    public description: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsEnum(RewardKind, { always: true })
    @Column({
        type: 'enum',
        enum: RewardKind
    })
    public kind: RewardKind;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsBoolean({ always: true })
    @Column({
        type: 'boolean',
        default: true
    })
    public recurrent: Boolean;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsDataURI()
    @Column('varchar', { nullable: true })
    public image: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { always: true })
    @Column('real', { nullable: true })
    public cost: number;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { always: true })
    @Column('real', { nullable: true })
    public amount: number;

    @ApiProperty()
    @ManyToMany(() => ChallengeEntity, challenge => challenge.granted_by)
    @JoinTable({
        joinColumn: { name: 'reward_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'challenge_id', referencedColumnName: 'id' }
    })
    public challenges: ChallengeEntity[];

    @RelationId((reward: RewardEntity) => reward.challenges)
    public challenge_ids: string[];

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(1000, { always: true })
    @Column('varchar', { nullable: true })
    public message: string;
}
