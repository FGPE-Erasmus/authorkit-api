import { CrudOperationEnum } from './crud-operation.enum';
import { ResourcePossession } from './resource-possession.enum';

/**
 * An interface that defines an access information to be queried.
 */
export interface Role {

    /**
     * Indicates the resource to be queried.
     */
    resource?: string;

    /**
     * Defines the type of the operation that is (or not) to be performed on
     * the resource by the defined role(s).
     */
    action?: CrudOperationEnum;

    /**
     * Defines the allowed possessions of the resource for the specified action.
     */
    possession?: ResourcePossession;
}
