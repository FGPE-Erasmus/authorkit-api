import { Column, PrimaryColumn } from 'typeorm';

import { ExtendedEntity } from '../../_helpers';

export class ExecutableEntity extends ExtendedEntity {

    @PrimaryColumn()
    public pathname: string;

    @Column()
    public command_line: string;
}
