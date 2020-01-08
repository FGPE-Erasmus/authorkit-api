import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';

import { AppLogger } from '../app.logger';
import { Observable } from 'rxjs';

/**
 * Interceptor that automatically filters request attributes based on access
 * control permissions.
 */
@Injectable()
export class ContextAccessInterceptor implements NestInterceptor {

    private logger = new AppLogger(ContextAccessInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        this.logger.silly('before ... ' + JSON.stringify(request.body));

        /* if (permissions) {
            const result = permissions.reduce((acc: any, permission: PermissionEntity) => {
                return permission.filter(acc);
            }, request.body);
            request.body = result;
        } */

        this.logger.silly('after ... ' + JSON.stringify(request.body));

        return next.handle();
    }
}

/* export const evaluateUserContextAccess: UserContextAccessEvaluator =
    async function (): Promise<UserContextAccess> {
        const req = RequestContext.currentRequest();
        const user = req['user'];
        const permission = req['permission'];
        if (!permission) {
            return {
                role: [],
                owner: false
            };
        }
        let owner = false;
        const project = req['project'];
        if (project) {
            owner = project.owner_id === user.id;
        }
        if (!permission) {
            return {
                role: [],
                owner
            };
        }
        return {
            role: permission.role,
            owner
        };
    };
 */
