import { Column } from 'typeorm';
import { IsOptional } from 'class-validator';
import { Exclude } from 'class-transformer';

import { ExtendedEntity } from './extended-entity';

export class TrackedFileEntity extends ExtendedEntity {

    @Exclude({ toPlainOnly: true })
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public sha: string;
}
