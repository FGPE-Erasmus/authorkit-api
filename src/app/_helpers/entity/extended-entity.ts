import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class ExtendedEntity extends BaseEntity {
    public id?: string;

    @Column('boolean', { default: false })
    public is_deleted = false;

    @ApiProperty()
    @CreateDateColumn({ type: 'timestamptz' })
    public created_at?: Date;

    @ApiProperty()
    @UpdateDateColumn({ type: 'timestamptz', nullable: true })
    public updated_at?: Date;
}
