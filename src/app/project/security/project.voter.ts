import { Injectable } from '@nestjs/common';

import { RestVoterActionEnum, OtherVoterActionEnum, Voter, AccessEnum } from '../../security';
import { AppLogger } from '../../app.logger';
import { UserEntity, UserRole } from '../../user/entity';
import { Decision } from '../../security/voter/decision';
import { ProjectEntity } from '../entity';
import { PermissionEntity } from '../entity/permission.entity';
import { ProjectService } from '../project.service';
import { ProjectAccessLevel } from '../entity/project-access-level.enum';

@Injectable()
export class ProjectVoter extends Voter {

    private logger = new AppLogger(ProjectVoter.name);

    private readonly actions = [
        RestVoterActionEnum.READ_ALL,
        RestVoterActionEnum.READ,
        RestVoterActionEnum.CREATE,
        RestVoterActionEnum.UPDATE,
        RestVoterActionEnum.SOFT_DELETE,
        RestVoterActionEnum.DELETE,
        OtherVoterActionEnum.MANAGE_PERMISSIONS
    ];

    private readonly listReadableProperties = [
        'id', 'name', 'description', 'owner_id', 'owner', 'is_public', 'status', 'created_at', 'updated_at', 'is_deleted'
    ];

    private readonly readableProperties = {
        [ProjectAccessLevel.NONE]       : [],
        [ProjectAccessLevel.VIEWER]     : ['id', 'name', 'description', 'owner_id', 'owner', 'is_public', 'status', 'created_at', 'updated_at', 'is_deleted'],
        [ProjectAccessLevel.CONTRIBUTOR]: ['id', 'name', 'description', 'owner_id', 'owner', 'is_public', 'status', 'created_at', 'updated_at', 'is_deleted'],
        [ProjectAccessLevel.OWNER]      : ['id', 'name', 'description', 'owner_id', 'owner', 'is_public', 'status', 'repo_owner', 'repo_name', 'permissions', 'created_at', 'updated_at', 'is_deleted'],
        [ProjectAccessLevel.ADMIN]      : ['id', 'name', 'description', 'owner_id', 'owner', 'is_public', 'status', 'repo_owner', 'repo_name', 'permissions', 'created_at', 'updated_at', 'is_deleted']
    };

    private readonly mutableProperties = {
        [ProjectAccessLevel.NONE]       : [],
        [ProjectAccessLevel.VIEWER]     : [],
        [ProjectAccessLevel.CONTRIBUTOR]: ['description'],
        [ProjectAccessLevel.OWNER]      : ['name', 'description', 'owner_id', 'owner', 'is_public', 'status', 'repo_owner', 'repo_name', 'permissions'],
        [ProjectAccessLevel.ADMIN]      : ['name', 'description', 'owner_id', 'owner', 'is_public', 'status', 'repo_owner', 'repo_name', 'permissions', 'is_deleted']
    };

    constructor(
            private readonly projectService: ProjectService) {
        super();
    }

    protected supports(action: any, subject: any): boolean {

        if (!this.actions.includes(action)) {
            return false;
        }

        if (Array.isArray(subject)) {
            return subject.every(element => element instanceof ProjectEntity);
        }

        return subject instanceof ProjectEntity;
    }

    protected async voteOnAction(
        action,
        subject: ProjectEntity | ProjectEntity[],
        context
    ): Promise<Decision> {
        const user = context.getUser();

        switch (action) {
            case RestVoterActionEnum.READ_ALL:
                return this.canReadAll(subject as ProjectEntity[], user);
            case RestVoterActionEnum.READ:
                return this.canRead(subject as ProjectEntity, user);
            case RestVoterActionEnum.CREATE:
                return this.canCreate(subject as ProjectEntity, user);
            case RestVoterActionEnum.UPDATE:
                return this.canUpdate(subject as ProjectEntity, user);
            case RestVoterActionEnum.DELETE:
                return this.canDelete(subject as ProjectEntity, user);
            case RestVoterActionEnum.SOFT_DELETE:
                return this.canSoftDelete(subject as ProjectEntity, user);
            case OtherVoterActionEnum.MANAGE_PERMISSIONS:
                return this.canManagePermissions(subject as ProjectEntity, user);
        }

        return Promise.resolve(new Decision(AccessEnum.ACCESS_DENIED));
    }

    /** REST Actions */

    private async canReadAll(projects: ProjectEntity[], user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canReadAll] checking if ${user.id} can read all projects`);
        if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.listReadableProperties);
        } else {
            for (let i = 0; i < projects.length; i++) {
                const decision = await this.canRead(projects[i], user);
                if (decision.vote === AccessEnum.ACCESS_DENIED) {
                    return new Decision(AccessEnum.ACCESS_DENIED);
                }
            }

            return new Decision(AccessEnum.ACCESS_GRANTED, this.listReadableProperties);
        }
    }

    private async canRead(project: ProjectEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canRead] who can read project ${project.id}?`);
        const accessLevel = await this.projectService
            .findAccessLevelOfUser(user.id.toString(), project.id.toString(), true);
        if (accessLevel === ProjectAccessLevel.NONE) {
            return new Decision(AccessEnum.ACCESS_DENIED);
        } else {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.readableProperties[accessLevel]);
        }
    }

    private async canCreate(project: ProjectEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canCreate] who can create a project? ${project.owner_id} ${user.id}`);
        console.log(project.owner_id + ' ' + user.id.toString());
        if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.mutableProperties[ProjectAccessLevel.ADMIN]);
        } else if (project.owner_id === user.id.toString()) {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.mutableProperties[ProjectAccessLevel.OWNER]);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }

    private async canUpdate(project: ProjectEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canUpdate] who can update project ${project.id}?`);
        const accessLevel = await this.projectService
            .findAccessLevelOfUser(user.id.toString(), project.id.toString(), true);
        if (accessLevel === ProjectAccessLevel.NONE) {
            return new Decision(AccessEnum.ACCESS_DENIED);
        } else {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.mutableProperties[accessLevel]);
        }
    }

    private async canDelete(project: ProjectEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canDelete] who can delete project ${project.id}?`);
        const accessLevel = await this.projectService
            .findAccessLevelOfUser(user.id.toString(), project.id.toString(), true);
        if (accessLevel === ProjectAccessLevel.ADMIN || accessLevel === ProjectAccessLevel.OWNER) {
            return new Decision(AccessEnum.ACCESS_GRANTED);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }

    private async canSoftDelete(project: ProjectEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canSoftDelete] who can mark project ${project.id} as deleted?`);
        const accessLevel = await this.projectService
            .findAccessLevelOfUser(user.id.toString(), project.id.toString(), true);
        if (accessLevel === ProjectAccessLevel.ADMIN || accessLevel === ProjectAccessLevel.OWNER) {
            return new Decision(AccessEnum.ACCESS_GRANTED);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }

    private async canManagePermissions(project: ProjectEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canManagePermissions] can ${user.id} manage permissions in project ${project.id}?`);
        const accessLevel = await this.projectService
            .findAccessLevelOfUser(user.id.toString(), project.id.toString(), true);
        if (accessLevel === ProjectAccessLevel.ADMIN || accessLevel === ProjectAccessLevel.OWNER) {
            return new Decision(AccessEnum.ACCESS_GRANTED);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }
}
