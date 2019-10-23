import { Column, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';
import { IsString, IsOptional, IsDefined, MinLength, IsEnum, MaxLength } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ExtendedEntity } from '../../_helpers';
import { TextFormat } from './text-format.enum';
import { ApiModelProperty } from '@nestjs/swagger';

const { CREATE, UPDATE } = CrudValidationGroups;

export class FormattedTextEntity extends ExtendedEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @MinLength(2, { always: true })
    @Column('varchar', { nullable: false })
    @Field()
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
