import { UserContextRole } from './user-context-role.enum';

/**
 * Access information of the user in the request context.
 */
export interface UserContextAccess {

    role?: UserContextRole[];

    owner?: boolean;
}
