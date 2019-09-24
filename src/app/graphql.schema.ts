/* tslint:disable */
export class DeleteUserInput {
    id: string;
}

export class UpdateUserInput {
    first_name?: string;
    last_name?: string;
    institution?: string;
    country?: string;
    email?: string;
    phone_num?: string;
    profile_img?: string;
    password?: string;
    facebook_id?: string;
    google_id?: string;
    twitter_id?: string;
    github_id?: string;
}

export abstract class IMutation {
    abstract updateUser(updateUserInput?: UpdateUserInput): User | Promise<User>;

    abstract deleteUser(deleteUserInput?: DeleteUserInput): User | Promise<User>;
}

export abstract class IQuery {
    abstract me(): User | Promise<User>;

    abstract temp__(): boolean | Promise<boolean>;
}

export abstract class ISubscription {
    abstract userCreated(): User | Promise<User>;

    abstract userDeleted(): User | Promise<User>;
}

export class User {
    id: string;
    first_name?: string;
    last_name?: string;
    institution?: string;
    country?: string;
    email?: string;
    phone_num?: string;
    profile_img?: string;
    password?: string;
    provider?: string;
    facebook_id?: string;
    google_id?: string;
    twitter_id?: string;
    github_id?: string;
    created_at?: Date;
    updated_at?: Date;
}

export type Date = any;
