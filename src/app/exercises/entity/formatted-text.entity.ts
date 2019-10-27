import { Column } from 'typeorm';
import { Field } from 'type-graphql';
import { IsString, IsOptional, IsDefined, IsEnum, MaxLength, IsEmpty } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TextFormat } from './text-format.enum';
import { ApiModelProperty } from '@nestjs/swagger';
import { TrackedFileEntity } from './tracked-file.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

export class FormattedTextEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsEmpty({ always: true })
    @Column('varchar', { nullable: false })
    public pathname: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @IsEnum(TextFormat, { always: true })
    @Column('enum', {
        enum: TextFormat
    })
    @Field(() => TextFormat)
    public format: TextFormat;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @MaxLength(25, { always: true })
    @Column('varchar', { length: 25, nullable: true })
    @Field()
    public nat_lang: string;
}
