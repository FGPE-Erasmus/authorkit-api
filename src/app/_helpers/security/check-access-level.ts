import { SelectQueryBuilder, getConnection } from 'typeorm';

import { AccessLevel, PermissionEntity } from '../../permissions/entity';

interface Join {
    src_table: string;
    dst_table: string;
    prop: string;
}

export async function checkAccessLevel(
    joins: Join[], condition: string,
    min_access_level: AccessLevel
): Promise<boolean> {

    if (!min_access_level) {
        return true;
    }

    const access_level = await getAccessLevel(joins, condition);

    const hasAccessLevel = () => access_level >= min_access_level;

    return access_level && hasAccessLevel();
}

export async function getAccessLevel(joins: Join[], condition: string): Promise<AccessLevel> {

    const qb: SelectQueryBuilder<PermissionEntity> = getConnection()
        .createQueryBuilder()
        .select('permission');

    qb.from(PermissionEntity, 'permission');

    joins.forEach(join => {
        qb.leftJoinAndSelect(`${join.src_table}.${join.prop}`, `${join.dst_table}`);
    });

    const permission = await qb.where(condition).getMany();
    const access_level = permission.length ? permission[0].access_level : AccessLevel.NONE;

    return access_level;
}
