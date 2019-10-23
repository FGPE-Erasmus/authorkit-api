import { ApiModelProperty } from '@nestjs/swagger';
import { Column, PrimaryColumn } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsDefined, IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ExtendedEntity } from '../../_helpers';
import { ResourceType } from './resource-type.enum';

const { CREATE, UPDATE } = CrudValidationGroups;

export class ResourceEntity extends ExtendedEntity {

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
    @IsEnum(ResourceType, { always: true })
    @Column('enum', {
        enum: ResourceType
    })
    @Field(() => ResourceType)
    public type: ResourceType;
}
