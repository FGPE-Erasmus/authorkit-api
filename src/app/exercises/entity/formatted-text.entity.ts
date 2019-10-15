import { Column, PrimaryColumn } from 'typeorm';

import { ExtendedEntity } from '../../_helpers';
import { TextFormat } from './text-format.enum';

export class FormattedTextEntity extends ExtendedEntity {

    @PrimaryColumn()
    public pathname: string;

    @Column()
    public format: TextFormat;

    @Column()
    public nat_lang: string;
}
