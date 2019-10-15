import { Column, PrimaryColumn } from 'typeorm';

import { ExtendedEntity } from '../../_helpers';

export class CodeEntity extends ExtendedEntity {

    @PrimaryColumn()
    public pathname: string;

    @Column()
    public lang: string;
}
