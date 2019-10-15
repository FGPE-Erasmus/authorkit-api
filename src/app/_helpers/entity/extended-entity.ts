import { ApiModelProperty } from '@nestjs/swagger';
import { BaseEntity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class ExtendedEntity extends BaseEntity {
    public id?: string;

    @Column('boolean', { default: false })
    public is_deleted = false;

    @ApiModelProperty()
    @CreateDateColumn({ type: 'timestamptz' })
    public created_at: Date;

    @ApiModelProperty()
    @UpdateDateColumn({ type: 'timestamptz', nullable: true })
    public updated_at: Date;
}
