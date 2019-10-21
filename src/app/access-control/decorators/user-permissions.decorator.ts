import { createParamDecorator } from '@nestjs/common';

/**
 * Access the user permissions from the request object i.e `req.user.permissions`.
 */
export const UserRoles = createParamDecorator((data: string, req) => {
  return data ? req.user[data] : req.user.permissions;
});
