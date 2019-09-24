import { ApiModelProperty } from '@nestjs/swagger';
import { BaseEntity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DateTime } from 'luxon';

export class ExtendedEntity extends BaseEntity {
    public id?: string;

    @Column()
    public is_deleted = false;

    @ApiModelProperty()
    @CreateDateColumn()
    public created_at: DateTime;

    @ApiModelProperty()
    @UpdateDateColumn()
    public updated_at: DateTime;
}
