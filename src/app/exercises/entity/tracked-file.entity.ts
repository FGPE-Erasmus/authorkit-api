import { Column } from 'typeorm';
import { IsOptional } from 'class-validator';

import { ExtendedEntity } from '../../_helpers';
import { Exclude } from 'class-transformer';

export class TrackedFileEntity extends ExtendedEntity {

    @Exclude({ toPlainOnly: true })
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public sha: string;
}
