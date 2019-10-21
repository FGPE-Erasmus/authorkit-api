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
        attributes: ['id', 'first_name', 'last_name', 'institution', 'country', 'email', 'phone_num', 'profile_img', 'facebook_id', 'google_id', 'twitter_id', 'github_id']
    })
    .addAccessInfo({
        role: '*',
        resource: 'user',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.OWN,
        attributes: ['id', 'first_name', 'last_name', 'institution', 'country', 'email', 'phone_num', 'profile_img', 'is_verified', 'provider', 'facebook_id', 'google_id', 'twitter_id', 'github_id', 'online_at', 'created_at', 'updated_at', 'is_deleted']
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
        attributes: ['name', 'description', 'owner_id', 'is_public', 'status', 'repo_owner', 'repo_name']
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'project',
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.ANY,
        attributes: ['name', 'description', 'owner_id', 'is_public', 'status', 'repo_owner', 'repo_name', 'permissions', 'is_deleted']
    })
    .addAccessInfo({
        role: UserRole.ADMIN,
        resource: 'project',
        action: CrudOperationEnum.LIST,
        possession: ResourcePossession.ANY,
        attributes: '*'
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
        attributes: ['name', 'description', 'is_public', 'status', 'repo_name', 'permissions']
    })
    .addAccessInfo({
        role: '*',
        resource: 'project',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.OWN,
        attributes: ['id', 'name', 'description', 'owner_id', 'is_public', 'status', 'repo_owner', 'repo_name', 'permissions', 'created_at', 'updated_at', 'is_deleted']
    })
    .addAccessInfo({
        role: '*',
        resource: 'project',
        action: CrudOperationEnum.LIST,
        possession: ResourcePossession.OWN,
        attributes: ['id', 'name', 'description', 'owner_id', 'is_public', 'status', 'repo_owner', 'repo_name', 'permissions', 'created_at', 'updated_at', 'is_deleted']
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
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.ANY,
        attributes: ['name', 'description', 'is_public', 'status', 'repo_name', 'permissions']
    })
    .addAccessInfo({
        role: UserContextRole.MANAGER,
        resource: 'project',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: ['id', 'name', 'description', 'owner_id', 'is_public', 'status', 'repo_owner', 'repo_name', 'permissions', 'created_at', 'updated_at', 'is_deleted']
    })
    .addAccessInfo({
        role: UserContextRole.MANAGER,
        resource: 'project',
        action: CrudOperationEnum.LIST,
        possession: ResourcePossession.ANY,
        attributes: ['id', 'name', 'description', 'owner_id', 'is_public', 'status', 'repo_owner', 'repo_name', 'permissions', 'created_at', 'updated_at', 'is_deleted']
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
        action: CrudOperationEnum.UPDATE,
        possession: ResourcePossession.ANY,
        attributes: ['description']
    })
    .addAccessInfo({
        role: UserContextRole.CONTRIBUTOR,
        resource: 'project',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: ['id', 'name', 'description', 'owner_id', 'is_public', 'status', 'repo_owner', 'repo_name', 'created_at', 'updated_at', 'is_deleted']
    })
    .addAccessInfo({
        role: UserContextRole.CONTRIBUTOR,
        resource: 'project',
        action: CrudOperationEnum.LIST,
        possession: ResourcePossession.ANY,
        attributes: ['id', 'name', 'description', 'owner_id', 'is_public', 'status', 'repo_owner', 'repo_name', 'created_at', 'updated_at', 'is_deleted']
    })

    // viewer
    .addAccessInfo({
        role: UserContextRole.VIEWER,
        resource: 'project',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY,
        attributes: ['id', 'name', 'description', 'owner_id', 'is_public', 'status', 'repo_owner', 'repo_name', 'created_at', 'updated_at', 'is_deleted']
    })
    .addAccessInfo({
        role: UserContextRole.VIEWER,
        resource: 'project',
        action: CrudOperationEnum.LIST,
        possession: ResourcePossession.ANY,
        attributes: ['id', 'name', 'description', 'owner_id', 'is_public', 'status', 'repo_owner', 'repo_name', 'created_at', 'updated_at', 'is_deleted']
    })

    // user
    .addAccessInfo({
        role: UserRole.USER,
        resource: 'project',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY,
        attributes: ['name', 'description', 'is_public', 'status', 'repo_name']
    });


