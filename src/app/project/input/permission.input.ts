import { InputType, Field } from 'type-graphql';
import { IsEnum } from 'class-validator';

import { ProjectAccessLevel } from '../entity/project-access-level.enum';

@InputType()
export class PermissionInput {

    @Field()
    public project_id: string;

    @Field()
    public user_id: string;

    @IsEnum(ProjectAccessLevel)
    @Field(type => ProjectAccessLevel)
    public access_level: ProjectAccessLevel;
}
