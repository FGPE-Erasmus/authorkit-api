import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SelectQueryBuilder, getConnection } from 'typeorm';

import { AppLogger } from '../../app.logger';
import { PermissionEntity } from '../entity/permission.entity';
import { AccessLevel } from '../entity/access-level.enum';

@Injectable()
export class MinAccessLevelGuard implements CanActivate {

    private logger = new AppLogger(MinAccessLevelGuard.name);

    constructor(
        public readonly id_path: string[],
        public readonly tables: Table[],
        public readonly joins: Join[],
        public readonly condition_tmpl: string,
        @Inject() private readonly reflector: Reflector
    ) {
    }

    async canActivate(
        context: ExecutionContext
    ): Promise<boolean> {

        this.logger.debug('[MinAccessLevelGuard] activated');

        const httpContext = context.switchToHttp();
        const req = httpContext.getRequest();

        const id = this.id_path.reduce((o, p) => o[p], req);

        const qb: SelectQueryBuilder<PermissionEntity> = getConnection()
            .createQueryBuilder();

        this.tables.forEach(t => {
            qb.from(t.entity, `${t.alias}`);
        });

        this.joins.forEach(join => {
            qb.leftJoin(`${join.src_table}.${join.prop}`, `${join.dst_table}`);
        });

        req.permissions = await qb
            .where(this.condition_tmpl, { id })
            .andWhere('user.id = :id', { id: req.user.id })
            .getMany();

        const minAccessLevel: AccessLevel = this.reflector.get<AccessLevel>(
            'minAccessLevel', context.getHandler());

        if (!minAccessLevel) {
            return true;
        }

        const accessLevel = req.permissions
            .map((p: PermissionEntity) => p.access_level);

        this.logger.debug('[MinAccessLevelGuard] has ' + accessLevel + ', required: ' + minAccessLevel);

        const hasAccessLevel = () => accessLevel >= minAccessLevel;

        return accessLevel && hasAccessLevel();
    }
}
