import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { IsOptional, IsEmpty, IsDefined, IsUUID, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity } from '../../../_helpers/entity/tracked-file.entity';
import { ChallengeEntity } from '../../challenges/entity/challenge.entity';
import { CriteriaEntity } from './criteria.entity';
import { GamificationLayerEntity } from '../../entity/gamification-layer.entity';
import { RuleActionEntity } from './rule-action.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('gl-rule')
export class RuleEntity extends TrackedFileEntity {

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => GamificationLayerEntity, gl => gl.rules, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gl_id' })
    @Column('uuid', { nullable: true })
    public gl_id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ChallengeEntity, challenge => challenge.rules, { onDelete: 'CASCADE' })
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
    @Column('simple-json', { nullable: true })
    public criteria: CriteriaEntity;

    @ApiProperty()
    @IsOptional({ always: true })
    @Column('simple-json', { nullable: true })
    public actions: RuleActionEntity[];
}
