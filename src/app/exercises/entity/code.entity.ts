import { ApiModelProperty } from '@nestjs/swagger';
import { Column, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsDefined, IsString, MinLength, MaxLength } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ExtendedEntity } from '../../_helpers';

const { CREATE, UPDATE } = CrudValidationGroups;

export class CodeEntity extends ExtendedEntity {

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
    @MaxLength(25, { always: true })
    @Column('varchar', { length: 25, nullable: false })
    @Field()
    public lang: string;
}
