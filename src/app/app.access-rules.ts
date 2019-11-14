import { AccessRulesBuilder, CrudOperationEnum, ResourcePossession, UserRole, UserContextRole } from './access-control';

export const accessRules: AccessRulesBuilder = new AccessRulesBuilder();

// MODULE - Users
accessRules

    // admin
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'user',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'user',
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'user',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'user',
        action: CrudOperationEnum.LIST,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'user',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'user',
        action: CrudOperationEnum.DELETE,
        possession: ResourcePossession.ANY
    })

    // own possession
    .addAccessInfo({
        role: '*',
        resource: 'user',
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.OWN,
        attributes: [
            'id', 'first_name', 'last_name', 'institution', 'country', 'email', 'phone_num', 'profile_img',
            'facebook_id', 'google_id', 'twitter_id', 'github_id'
        ]
    })
    .addAccessInfo({
        role: '*',
        resource: 'user',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.OWN,
        attributes: [
            'id', 'first_name', 'last_name', 'institution', 'country', 'email', 'phone_num', 'profile_img',
            'facebook_id', 'google_id', 'twitter_id', 'github_id'
        ]
    })
    .addAccessInfo({
        role: '*',
        resource: 'user',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.OWN,
        attributes: [
            'id', 'first_name', 'last_name', 'institution', 'country', 'email', 'phone_num', 'profile_img', 'is_verified',
            'provider', 'facebook_id', 'google_id', 'twitter_id', 'github_id',
            'online_at', 'created_at', 'updated_at', 'is_deleted'
        ]
    })
    .addAccessInfo({
        role: '*',
        resource: 'user',
        action: CrudOperationEnum.DELETE,
        possession: ResourcePossession.OWN
    });


// MODULE - Projects
accessRules

    // admin
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'project',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY,
        attributes: ['name', 'description', 'owner_id', 'is_public', 'status']
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'project',
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.ANY,
        attributes: ['name', 'description', 'owner_id', 'is_public', 'status', 'permissions', 'is_deleted']
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'project',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY,
        attributes: ['name', 'description', 'owner_id', 'is_public', 'status', 'permissions', 'is_deleted']
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'project',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'project',
        action: CrudOperationEnum.DELETE,
        possession: ResourcePossession.ANY
    })

    // own possession
    .addAccessInfo({
        role: '*',
        resource: 'project',
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.OWN,
        attributes: ['name', 'description', 'is_public', 'status', 'permissions']
    })
    .addAccessInfo({
        role: '*',
        resource: 'project',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.OWN,
        attributes: ['name', 'description', 'is_public', 'status', 'permissions']
    })
    .addAccessInfo({
        role: '*',
        resource: 'project',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.OWN,
        attributes: [
            'id',
            'name',
            'description',
            'owner_id',
            'is_public',
            'status',
            'permissions',
            'created_at',
            'updated_at',
            'is_deleted'
        ]
    })
    .addAccessInfo({
        role: '*',
        resource: 'project',
        action: CrudOperationEnum.DELETE,
        possession: ResourcePossession.OWN
    })

    // manager
    .addAccessInfo({
        role: UserContextRole.MANAGER,
        resource: 'project',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY,
        attributes: ['name', 'description', 'is_public', 'status', 'permissions']
    })
    .addAccessInfo({
        role: UserContextRole.MANAGER,
        resource: 'project',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: [
            'id',
            'name',
            'description',
            'owner_id',
            'is_public',
            'status',
            'permissions',
            'created_at',
            'updated_at',
            'is_deleted'
        ]
    })
    .addAccessInfo({
        role: UserContextRole.MANAGER,
        resource: 'project',
        action: CrudOperationEnum.DELETE,
        possession: ResourcePossession.ANY
    })

    // contributor
    .addAccessInfo({
        role: UserContextRole.CONTRIBUTOR,
        resource: 'project',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY,
        attributes: ['description']
    })
    .addAccessInfo({
        role: UserContextRole.CONTRIBUTOR,
        resource: 'project',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: ['id', 'name', 'description', 'owner_id', 'is_public', 'status', 'created_at', 'updated_at', 'is_deleted']
    })

    // viewer
    .addAccessInfo({
        role: UserContextRole.VIEWER,
        resource: 'project',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: ['id', 'name', 'description', 'owner_id', 'is_public', 'status', 'created_at', 'updated_at', 'is_deleted']
    })

    // user
    .addAccessInfo({
        role: UserRole.USER,
        resource: 'project',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY,
        attributes: ['name', 'description', 'is_public', 'status']
    })

    // any
    .addAccessInfo({
        role: '*',
        resource: 'project',
        action: CrudOperationEnum.LIST,
        possession: ResourcePossession.ANY,
        attributes: [
            'data',
            'data.id',
            'data.name',
            'data.description',
            'data.owner_id',
            'data.is_public',
            'data.status',
            'data.created_at',
            'data.updated_at',
            'count',
            'total',
            'page',
            'pageCount'
        ]
    });


// MODULE - Exercises
accessRules

    // admin
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'exercise',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'exercise',
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'exercise',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'exercise',
        action: CrudOperationEnum.DELETE,
        possession: ResourcePossession.ANY
    })

    // own possession
    .addAccessInfo({
        role: '*',
        resource: 'exercise',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.OWN,
        attributes: '*'
    })
    .addAccessInfo({
        role: '*',
        resource: 'exercise',
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.OWN,
        attributes: '*'
    })
    .addAccessInfo({
        role: '*',
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.OWN,
        attributes: '*'
    })
    .addAccessInfo({
        role: '*',
        resource: 'exercise',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.OWN,
        attributes: '*'
    })
    .addAccessInfo({
        role: '*',
        resource: 'exercise',
        action: CrudOperationEnum.DELETE,
        possession: ResourcePossession.OWN
    })

    // manager
    .addAccessInfo({
        role: UserContextRole.MANAGER,
        resource: 'exercise',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY,
        attributes: ['!owner_id']
    })
    .addAccessInfo({
        role: UserContextRole.MANAGER,
        resource: 'exercise',
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.ANY,
        attributes: ['!project_id', '!owner_id']
    })
    .addAccessInfo({
        role: UserContextRole.MANAGER,
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY,
        attributes: ['!project_id', '!owner_id']
    })
    .addAccessInfo({
        role: UserContextRole.MANAGER,
        resource: 'exercise',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })
    .addAccessInfo({
        role: UserContextRole.MANAGER,
        resource: 'exercise',
        action: CrudOperationEnum.DELETE,
        possession: ResourcePossession.ANY
    })

    // contributor
    .addAccessInfo({
        role: UserContextRole.CONTRIBUTOR,
        resource: 'exercise',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY,
        attributes: ['!owner_id']
    })
    .addAccessInfo({
        role: UserContextRole.CONTRIBUTOR,
        resource: 'exercise',
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.ANY,
        attributes: ['!project_id', '!owner_id']
    })
    .addAccessInfo({
        role: UserContextRole.CONTRIBUTOR,
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY,
        attributes: ['!project_id', '!owner_id']
    })
    .addAccessInfo({
        role: UserContextRole.CONTRIBUTOR,
        resource: 'exercise',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })

    // viewer
    .addAccessInfo({
        role: UserContextRole.VIEWER,
        resource: 'exercise',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: '*'
    })

    // any
    .addAccessInfo({
        role: '*',
        resource: 'exercise',
        action: CrudOperationEnum.LIST,
        possession: ResourcePossession.ANY,
        attributes: [
            'data',
            'data.id',
            'data.title',
            'data.module',
            'data.owner_id',
            'data.project_id',
            'data.keywords',
            'data.type',
            'data.event',
            'data.platform',
            'data.difficulty',
            'data.status',
            'data.created_at',
            'data.updated_at',
            'count',
            'total',
            'page',
            'pageCount'
        ]
    });


