import { Column, PrimaryGeneratedColumn, ManyToOne, Entity, JoinColumn, Index } from 'typeorm';

import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity, ResourceEntity } from '../../_helpers';
import {ApiProperty} from '@nestjs/swagger';
import {IsDefined, IsEmpty, IsNotEmpty, IsOptional, IsUUID} from 'class-validator';
import {ProjectEntity} from '../../project/entity';
import {UserEntity} from '../../user/entity';


const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('gamification-template')
export class GamificationTemplateEntity extends TrackedFileEntity {
    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    public template_id: string;
    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    public exercises_list: string[];

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => UserEntity, user => user.id)
    @JoinColumn({ name: 'owner_id' })
    @Column('uuid', { nullable: false })
    public owner_id: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNotEmpty({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ProjectEntity, project => project.gamification_layers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    @Column('uuid', { nullable: false })
    public project_id: string;
}
