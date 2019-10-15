import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';
import { IsString, IsEnum } from 'class-validator';

import { ExtendedEntity } from '../../_helpers';
import { ProjectAccessLevel } from './project-access-level.enum';
import { ProjectEntity } from '../../project/entity';
import { UserEntity } from '../../user/entity';

@Entity('permission')
export class PermissionEntity extends ExtendedEntity {

    @PrimaryColumn('uuid')
    @Field()
    public project_id: string;

    @ManyToOne(type => ProjectEntity, project => project.permissions, { primary: true })
    @JoinColumn({ name: 'project_id' })
    public project: ProjectEntity;

    @PrimaryColumn('uuid')
    @Field()
    public user_id: string;

    @ManyToOne(type => UserEntity, user => user.permissions, { primary: true })
    @JoinColumn({ name: 'user_id' })
    public user: UserEntity;

    @IsEnum(ProjectAccessLevel)
    @Field(type => ProjectAccessLevel)
    @Column('enum', {
        enum: ProjectAccessLevel
    })
    public access_level: ProjectAccessLevel;
}
