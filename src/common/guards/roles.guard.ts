import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

/**
 * Guard that only allows authenticated requests of users with one of the given roles to
 * proceed to the route handler.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }

        const req = context.switchToHttp().getRequest();
        const user = req.user;

        const hasRole = () => user.roles.some((role: string) => roles.includes(role));

        return user && user.roles && hasRole();
    }
}
