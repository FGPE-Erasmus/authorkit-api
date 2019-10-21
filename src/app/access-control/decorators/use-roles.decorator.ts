import { SetMetadata } from '@nestjs/common';

import { Role } from '../role.interface';

/**
 * Define the access information required for this route.
 * Notice that all access rules must be satisfied/Passed
 */
export const UseRoles = (...roles: Role[]) => SetMetadata('roles', roles);
