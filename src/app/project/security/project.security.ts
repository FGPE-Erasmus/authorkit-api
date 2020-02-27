import { DeepPartial } from '../../_helpers/database/deep-partial';
import { AccessLevel } from '../../permissions/entity/access-level.enum';
import { ProjectEntity } from '../entity/project.entity';
import { UserEntity } from '../../user/entity/user.entity';

const ALLOWED_MUTATIONS = {
    [AccessLevel.OWNER]: ['name', 'description', 'status', 'is_public'],
    [AccessLevel.ADMIN]: ['name', 'description', 'status'],
    [AccessLevel.CONTRIBUTOR]: ['name', 'description'],
    [AccessLevel.VIEWER]: []
};

const ALLOWED_READ = {
    [AccessLevel.OWNER]: ['id', 'name', 'description', 'status', 'is_public', 'exercises', 'gamification_layers', 'permissions', 'countContributors', 'countExercises', 'countGamificationLayers'],
    [AccessLevel.ADMIN]: ['id', 'name', 'description', 'status', 'is_public', 'exercises', 'gamification_layers', 'permissions', 'countContributors', 'countExercises', 'countGamificationLayers'],
    [AccessLevel.CONTRIBUTOR]: ['id', 'name', 'description', 'status', 'is_public', 'exercises', 'gamification_layers', 'countContributors', 'countExercises', 'countGamificationLayers'],
    [AccessLevel.VIEWER]: ['id', 'name', 'description', 'status', 'is_public', 'exercises', 'gamification_layers', 'countContributors', 'countExercises', 'countGamificationLayers']
};

export function filterUpdateDto(dto: DeepPartial<ProjectEntity>, access_level: AccessLevel): DeepPartial<ProjectEntity> {

    const allowed = ALLOWED_MUTATIONS[access_level];
    if (allowed) {
        return Object.keys(dto)
            .filter(key => allowed.includes(key))
            .reduce((obj, key) => {
                return {
                    ...obj,
                    [key]: dto[key]
                };
            }, {});
    }
    return {};
}

export function filterReadDto(dto: DeepPartial<ProjectEntity>, access_level: AccessLevel) {

    const allowed = ALLOWED_READ[access_level];
    if (allowed) {
        return Object.keys(dto)
            .filter(key => allowed.includes(key))
            .reduce((obj, key) => {
                return {
                    ...obj,
                    [key]: dto[key]
                };
            }, {});
    }
    return {};
}

export async function filterReadMany(res: any, user: UserEntity): Promise<any> {
    if (Array.isArray(res)) {
        return await Promise.all(res.map(async p => {
            const permission = (await p.permissions).find(perm => perm.user_id === user.id);
            return filterReadDto(p, permission && permission.access_level);
        }));
    } else {
        res.data = await Promise.all(res.data.map(async (p: ProjectEntity) => {
            const permission = (await p.permissions).find(perm => perm.user_id === user.id);
            return filterReadDto(p, permission && permission.access_level);
        }));
        return res;
    }
}
