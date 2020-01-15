import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Field, ObjectType } from 'type-graphql';
import { IsEnum } from 'class-validator';

import { ExtendedEntity } from '../../_helpers/entity/extended-entity';
import { ProjectEntity } from '../../project/entity/project.entity';
import { UserEntity } from '../../user/entity/user.entity';
import { AccessLevel } from './access-level.enum';

@Entity('permission')
@ObjectType()
export class PermissionEntity extends ExtendedEntity {

    @ApiModelProperty()
    @PrimaryColumn('uuid')
    @ManyToOne(() => ProjectEntity, project => project.permissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    @Field()
    public project_id: string;

    @ApiModelProperty()
    @PrimaryColumn('uuid')
    @ManyToOne(() => UserEntity, user => user.permissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    @Field()
    public user_id: string;

    @ApiModelProperty()
    @IsEnum(AccessLevel)
    @Column('enum', {
        enum: AccessLevel
    })
    @Field(() => AccessLevel)
    public access_level: AccessLevel;
}
