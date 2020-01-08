import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Permission } from 'accesscontrol';
import { Observable } from 'rxjs';

import { AppLogger } from '../app.logger';

/**
 * Interceptor that automatically filters request attributes based on access
 * control permissions.
 */
@Injectable()
export class AccessControlRequestInterceptor implements NestInterceptor {

    private logger = new AppLogger(AccessControlRequestInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        this.logger.debug('intercepting request for access control filtering ...');

        const request = context.switchToHttp().getRequest();

        this.logger.silly('before ... ' + JSON.stringify(request.body));

        if (request.permissions) {
            const result = request.permissions.reduce((acc: any, permission: Permission) => {
                return permission.filter(acc);
            }, request.body);
            request.body = result;
        }

        this.logger.silly('after ... ' + JSON.stringify(request.body));

        return next.handle();
    }
}
