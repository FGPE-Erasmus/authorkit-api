import { Column, PrimaryColumn } from 'typeorm';

import { ExtendedEntity } from '../../_helpers';
import { ResourceType } from './resource-type.enum';

export class ResourceEntity extends ExtendedEntity {

    @PrimaryColumn()
    public pathname: string;

    @Column({
        type: 'enum',
        enum: ResourceType
    })
    public type: ResourceType;
}
