import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

import { ExtendedEntity } from '../../_helpers';
import { ProjectAccessLevel } from './project-access-level.enum';

@Entity('project-user')
export class ProjectUserEntity extends ExtendedEntity {

    @ApiModelProperty()
    @PrimaryGeneratedColumn()
    public id: string;

    @ApiModelProperty()
    @IsString()
    @Column()
    public project_id: string;

    @ApiModelProperty()
    @IsString()
    @Column()
    public user_id: string;

    @ApiModelProperty()
    @IsEnum(ProjectAccessLevel)
    @Column()
    public access_level: ProjectAccessLevel;
}
