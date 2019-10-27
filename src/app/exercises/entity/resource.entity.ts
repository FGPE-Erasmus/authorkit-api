import { ApiModelProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import { Field } from 'type-graphql';
import { IsOptional, IsDefined, IsString, IsEnum, IsEmpty } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ResourceType } from './resource-type.enum';
import { TrackedFileEntity } from './tracked-file.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

export class ResourceEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsEmpty({ always: true })
    @Column('varchar', { nullable: false })
    public pathname: string;

    /* @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @IsEnum(ResourceType, { always: true })
    @Column('enum', {
        enum: ResourceType
    })
    @Field(() => ResourceType)
    public type: ResourceType; */
}
