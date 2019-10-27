import { Field, InputType } from 'type-graphql';
import { IsString, Length, IsOptional, MaxLength, IsBoolean, IsEnum, IsNotEmpty, Validate } from 'class-validator';

import { GithubReponameValidator } from '../../_helpers/validators';
import { ProjectStatus } from '../entity';

@InputType()
export class ProjectInput {

    @IsString()
    @Length(2, 50)
    @Field()
    readonly name: string;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    @Field()
    readonly description?: string;

    @Field()
    readonly owner_id?: string;

    @IsBoolean()
    @Field()
    readonly is_public?: boolean;

    @IsEnum(ProjectStatus)
    @Field()
    readonly status?: ProjectStatus = ProjectStatus.DRAFT;

    /* @IsString()
    @IsNotEmpty()
    @Validate(GithubReponameValidator)
    @Field()
    readonly repo_name?: string; */
}
