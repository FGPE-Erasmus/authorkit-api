import { UserContextRole } from './user-context-role.enum';

/**
 * Interface with access information of the user for the context of the request.
 */
export interface IUserContextAccess {

    /**
     * Role of the user for the requested resource.
     */
    role?: UserContextRole[];

    /**
     * Is this user the owner of the requested resource?
     */
    owner?: boolean;
}
