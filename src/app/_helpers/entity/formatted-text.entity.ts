import { Column } from 'typeorm';
import { IsString, IsOptional, IsDefined, IsEnum, MaxLength, IsEmpty } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';
import { ApiProperty } from '@nestjs/swagger';

import { TextFormat } from './text-format.enum';
import { TrackedFileEntity } from './tracked-file.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

export class FormattedTextEntity extends TrackedFileEntity {

    @Column('simple-json', { nullable: true })
    public file: TrackedFileEntity;

    @ApiProperty()
    @IsEmpty({ always: true })
    @Column('varchar', { nullable: false })
    public pathname: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @IsEnum(TextFormat, { always: true })
    @Column('enum', {
        enum: TextFormat
    })
    public format: TextFormat;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @MaxLength(25, { always: true })
    @Column('varchar', { length: 25, nullable: true })
    public nat_lang: string;
}
