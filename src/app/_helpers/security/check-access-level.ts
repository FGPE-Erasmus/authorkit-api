import { SelectQueryBuilder, getConnection } from 'typeorm';

import { AccessLevel, PermissionEntity } from '../../permissions/entity';
import { ProjectEntity } from '../../project/entity';

interface Join {
    src_table: string;
    dst_table: string;
    prop: string;
}

export async function checkAccessLevel(
    joins: Join[], condition: string, conditionUserId: string,
    min_access_level: AccessLevel
): Promise<boolean> {

    if (!min_access_level) {
        return true;
    }

    const access_level = await getAccessLevel(joins, condition, conditionUserId);

    const hasAccessLevel = () => access_level >= min_access_level;

    return access_level && hasAccessLevel();
}

export async function getAccessLevel(joins: Join[], condition: string, conditionUserId: string): Promise<AccessLevel> {

    const qb: SelectQueryBuilder<PermissionEntity> = getConnection()
        .createQueryBuilder()
        .select('permission');

    qb.from(PermissionEntity, 'permission');
    qb.leftJoinAndSelect('permission.project_id', 'project');

    joins.forEach(join => {
        qb.leftJoinAndSelect(`${join.src_table}.${join.prop}`, `${join.dst_table}`);
    });

    const permission = await qb.where(`${condition} AND ${conditionUserId}`).getMany();
    const access_level = permission.length ? permission[0].access_level : AccessLevel.NONE;

    if (access_level === AccessLevel.NONE) {
        const qbProject: SelectQueryBuilder<ProjectEntity> = getConnection()
            .createQueryBuilder()
            .select('project');
        qbProject.from(ProjectEntity, 'project');
        joins.forEach(join => {
            qbProject.leftJoinAndSelect(`${join.src_table}.${join.prop}`, `${join.dst_table}`);
        });
        const project: ProjectEntity = await qbProject.where(condition).getOne();
        if (project.is_public) {
            return AccessLevel.VIEWER;
        }
    }

    return access_level;
}
