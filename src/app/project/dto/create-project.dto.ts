
import { Field, ObjectType } from 'type-graphql';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional, MaxLength, IsEnum, IsNotEmpty, Validate, IsBoolean } from 'class-validator';

import { ProjectStatus } from '../entity';
import { GithubReponameValidator } from '../../_helpers/validators';

@ObjectType()
export class CreateProjectDto {

    @ApiModelProperty()
    @Field()
    readonly id?: string;

    @ApiModelProperty()
    @IsString()
    @Length(2, 50)
    @Field()
    readonly name: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @MaxLength(250)
    @Field()
    readonly description?: string;

    @ApiModelProperty()
    @Field()
    readonly owner_id?: string;

    @ApiModelProperty()
    @IsBoolean()
    @Field()
    readonly is_public?: boolean;

    @ApiModelProperty()
    @IsEnum(ProjectStatus)
    @Field()
    readonly status?: ProjectStatus = ProjectStatus.DRAFT;

    /* @ApiModelProperty()
    @IsString()
    @IsNotEmpty()
    @Validate(GithubReponameValidator)
    @Field()
    readonly repo_name?: string; */
}
