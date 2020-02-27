
import { Field, ObjectType } from 'type-graphql';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional, MaxLength, IsEnum, IsBoolean } from 'class-validator';

import { ProjectStatus } from '../entity';

@ObjectType()
export class UpdateProjectDto {

    @ApiModelProperty()
    @Field()
    readonly id?: string;

    @ApiModelProperty()
    @IsString()
    @Length(2, 50)
    @Field()
    readonly name?: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @MaxLength(250)
    @Field()
    readonly description?: string;

    @ApiModelProperty()
    @IsBoolean()
    @Field()
    readonly is_public?: boolean;

    @ApiModelProperty()
    @IsEnum(ProjectStatus)
    @Field()
    readonly status?: ProjectStatus;
}
