import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Permission } from 'accesscontrol';
import { Observable } from 'rxjs';

import { AppLogger } from '..';

/**
 * Interceptor that automatically filter request attributes based on access control
 * permissions.
 */
@Injectable()
export class AccessControlRequestInterceptor implements NestInterceptor {

    private logger = new AppLogger(AccessControlRequestInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { permissions } = request;

        this.logger.silly('before ... ' + JSON.stringify(request.body));

        if (permissions) {
            const result = permissions.reduce((acc: any, permission: Permission) => {
                return permission.filter(acc);
            }, request.body);
            request.body = result;
        }

        this.logger.silly('after ... ' + JSON.stringify(request.body));

        return next.handle();
    }
}
