import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { IsEnum } from 'class-validator';

import { ExtendedEntity } from '../../_helpers/entity/extended-entity';
import { ProjectEntity } from '../../project/entity/project.entity';
import { UserEntity } from '../../user/entity/user.entity';
import { AccessLevel } from './access-level.enum';

@Entity('permission')
export class PermissionEntity extends ExtendedEntity {

    @ApiProperty()
    @PrimaryColumn('uuid')
    @ManyToOne(() => ProjectEntity, project => project.permissions, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'project_id', referencedColumnName: 'id' })
    public project_id: string;

    @ApiProperty()
    @PrimaryColumn('uuid')
    @ManyToOne(() => UserEntity, user => user.permissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
    public user_id: string;

    @ApiProperty()
    @IsEnum(AccessLevel)
    @Column('enum', {
        enum: AccessLevel
    })
    public access_level: AccessLevel;
}
