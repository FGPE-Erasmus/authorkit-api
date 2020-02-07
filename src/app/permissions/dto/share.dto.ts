import { Field, ObjectType } from 'type-graphql';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsDefined } from 'class-validator';

import { AccessLevel } from '../entity/access-level.enum';

@ObjectType()
export class ShareDto {

    @ApiModelProperty()
    @IsDefined({ always: true })
    @IsUUID('4', { always: true })
    @Field()
    readonly project_id: string;

    @ApiModelProperty()
    @IsDefined({ always: true })
    @IsUUID('4', { always: true })
    @Field()
    readonly user_id: string;

    @ApiModelProperty()
    @IsDefined({ always: true })
    @IsEnum(AccessLevel, { always: true })
    @Field()
    readonly access_level: AccessLevel;
}
