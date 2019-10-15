
import { Field, ObjectType } from 'type-graphql';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional, MaxLength, IsEnum, IsNotEmpty, Validate, IsBoolean } from 'class-validator';

import { ProjectStatus } from '../entity';
import { GithubReponameValidator } from '../../_helpers/validators';
import { PrimaryColumn } from 'typeorm';
import { ProjectAccessLevel } from '../entity/project-access-level.enum';

@ObjectType()
export class AddPermissionDto {

    @ApiModelProperty()
    @Field()
    public user_id: string;

    @ApiModelProperty()
    @IsEnum(ProjectAccessLevel)
    @Field(type => ProjectAccessLevel)
    public access_level: ProjectAccessLevel;
}
