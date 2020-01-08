import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IQueryInfo, Permission } from 'accesscontrol';

import { InjectAccessRulesBuilder } from './decorators/inject-access-rules-builder.decorator';
import { AccessRulesBuilder } from './access-rules.builder';
import { Role } from './role.interface';
import { UserContextAccessEvaluator } from './user-context-access.evaluator';
import { IUserContextAccess } from './user-context-access.interface';
import { ResourcePossession } from './resource-possession.enum';

@Injectable()
export class ACGuard<User extends any = any> implements CanActivate {

    constructor(
        private readonly reflector: Reflector,
        @InjectAccessRulesBuilder() private readonly ruleBuilder: AccessRulesBuilder
    ) {
        ruleBuilder.build();
    }

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const userRoles = await this.getUserRoles(context);

        const roles = this.reflector.get<Role[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }

        const userAccessInfo = await this.getUserAccessInfoForContext(context);

        const hasRoles = roles.every(role => {
            const queryInfo: IQueryInfo = role;
            queryInfo.role = [...userRoles, ...userAccessInfo.role];
            if (role.possession === ResourcePossession.OWN && !userAccessInfo.owner) {
                return false;
            }
            queryInfo.possession = userAccessInfo.owner ? ResourcePossession.OWN : ResourcePossession.ANY;
            const permission = this.ruleBuilder.permission(queryInfo);
            this.setContextPermission(context, permission);
            return permission.granted;
        });

        return hasRoles;
    }

    protected async getUser(context: ExecutionContext): Promise<User> {
        const request = context.switchToHttp().getRequest();
        return request.user;
    }

    protected async getUserRoles(context: ExecutionContext): Promise<string | string[]> {
        const user = await this.getUser(context);
        if (!user) { throw new UnauthorizedException(); }
        return user.roles;
    }

    protected async getUserAccessInfoForContext(context: ExecutionContext): Promise<IUserContextAccess> {
        const contextAccessInfoEvaluator = this.reflector.get<UserContextAccessEvaluator>(
            'access-evaluator', context.getHandler());
        if (!contextAccessInfoEvaluator) {
            return {
                role: [],
                owner: false
            };
        }
        return await contextAccessInfoEvaluator();
    }

    protected async setContextPermission(context: ExecutionContext, permission: Permission) {
        const request = context.switchToHttp().getRequest();
        request.permissions = [...(request.permissions || []), permission];
    }
}
