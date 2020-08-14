import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { getConnection, SelectQueryBuilder } from 'typeorm';
import { Observable } from 'rxjs';

import { AppLogger } from '../app.logger';
import { AccessLevel, PermissionEntity } from '../permissions/entity';
import { UserEntity } from '../user/entity/user.entity';

interface Table {
    entity: any;
    alias: string;
}

interface Join {
    src_table: string;
    dst_table: string;
    prop: string;
}

/**
 * Interceptor that loads the permission of the calling user in the context of
 * the requested objects.
 */
@Injectable()
export class PermissionLoaderInterceptor implements NestInterceptor {

    private logger = new AppLogger(PermissionLoaderInterceptor.name);

    constructor(
    public readonly id_path: string[],
    public readonly tables: Table[],
    public readonly joins: Join[],
    public readonly condition_tmpl: string) {
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {

        const req = context.switchToHttp().getRequest();

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

        this.logger.debug(`permissions: ${req.permissions}`);

        return next.handle();
    }
}
