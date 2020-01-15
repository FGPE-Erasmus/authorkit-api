import { ApiModelProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import { IsOptional, IsDefined, IsEnum, IsArray, IsString, MaxLength } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { RuleActionType } from './rule-action-type.enum';

const { CREATE, UPDATE } = CrudValidationGroups;

export class RuleActionEntity {

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsEnum(RuleActionType, { always: true })
    @Column({
        type: 'enum',
        enum: RuleActionType
    })
    public type: RuleActionType;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(150, { always: true, each: true })
    @Column('simple-array', { default: [] })
    public parameters: string[];
}
