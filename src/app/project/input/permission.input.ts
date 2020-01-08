import { InputType, Field } from 'type-graphql';
import { IsEnum } from 'class-validator';

import { UserContextRole } from 'app/access-control/user-context-role.enum';

@InputType()
export class PermissionInput {

    @Field()
    public project_id: string;

    @Field()
    public user_id: string;

    @IsEnum(UserContextRole)
    @Field(type => UserContextRole)
    public role: UserContextRole;
}
