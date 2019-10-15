import { Injectable } from '@nestjs/common';
import { RestVoterActionEnum, Voter, AccessEnum } from '../../security';
import { AppLogger } from '../../app.logger';
import { UserService } from '../../user/user.service';
import { UserEntity, UserRole } from '../../user/entity';
import { Decision } from '../../security/voter/decision';
import { ProjectAccessLevel } from '../entity/project-access-level.enum';
import { ProjectUserEntity } from '../entity';
import { ProjectUserService } from '../project-user.service';

@Injectable()
export class ProjectUserVoter extends Voter {

    private logger = new AppLogger(ProjectUserVoter.name);

    private readonly actions = [
        RestVoterActionEnum.READ,
        RestVoterActionEnum.CREATE,
        RestVoterActionEnum.UPDATE,
        RestVoterActionEnum.DELETE
    ];

    constructor(
            private readonly userService: UserService,
            private readonly projectUserService: ProjectUserService) {
        super();
    }

    protected supports(action: any, subject: any): boolean {

        if (!this.actions.includes(action)) {
            return false;
        }

        if (Array.isArray(subject)) {
            return subject.every(element => element instanceof ProjectUserEntity);
        }

        return subject instanceof ProjectUserEntity;
    }

    protected async voteOnAction(action, subject: ProjectUserEntity | ProjectUserEntity[], context): Promise<Decision> {
        const user = context.getUser();

        switch (action) {
            case RestVoterActionEnum.READ_ALL:
                return this.canReadAll(subject as ProjectUserEntity[], user);
            case RestVoterActionEnum.READ:
                return this.canRead(subject as ProjectUserEntity, user);
            case RestVoterActionEnum.CREATE:
                return this.canCreate(subject as ProjectUserEntity, user);
            case RestVoterActionEnum.UPDATE:
                return this.canUpdate(subject as ProjectUserEntity, user);
            case RestVoterActionEnum.DELETE:
                return this.canDelete(subject as ProjectUserEntity, user);
        }

        return Promise.resolve(new Decision(AccessEnum.ACCESS_DENIED));
    }

    /** REST Actions */

    private async canReadAll(projectUsers: ProjectUserEntity[], user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canReadAll] checking if ${user.id} can read all project permissions`);
        if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED, ['*']);
        } else {
            for (let i = 0; i < projectUsers.length; i++) {
                const decision = await this.canRead(projectUsers[i], user);
                if (decision.vote === AccessEnum.ACCESS_DENIED) {
                    return new Decision(AccessEnum.ACCESS_DENIED);
                }
            }

            return new Decision(AccessEnum.ACCESS_GRANTED, ['*']);
        }
    }

    private async canRead(projectUser: ProjectUserEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canRead] ${user.id} can read a project-user relation?`);
        if (projectUser.user_id === user.id.toString()) {
            return new Decision(AccessEnum.ACCESS_GRANTED, ['*']);
        } else if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED, ['*']);
        } else {
            const accessLevel = await this.projectUserService
                .findAccessLevelOfUserInProject(user.id.toString(), projectUser.project_id.toString());
            if (accessLevel === ProjectAccessLevel.ADMIN ||
                accessLevel === ProjectAccessLevel.OWNER) {
                return new Decision(AccessEnum.ACCESS_GRANTED, ['*']);
            } else {
                return new Decision(AccessEnum.ACCESS_DENIED);
            }
        }
    }

    private async canCreate(projectUser: ProjectUserEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canCreate] ${user.id} can create a project-user relation?`);
        if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED, ['*']);
        } else {
            const accessLevel = await this.projectUserService
                .findAccessLevelOfUserInProject(user.id.toString(), projectUser.project_id.toString());
            if (accessLevel === ProjectAccessLevel.ADMIN || accessLevel === ProjectAccessLevel.OWNER) {
                return new Decision(AccessEnum.ACCESS_GRANTED, ['*']);
            } else {
                return new Decision(AccessEnum.ACCESS_DENIED);
            }
        }
    }

    private async canUpdate(projectUser: ProjectUserEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canUpdate] ${user.id} can update a project-user relation?`);
        if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED, ['*']);
        } else {
            const accessLevel = await this.projectUserService
                .findAccessLevelOfUserInProject(user.id.toString(), projectUser.project_id.toString());
            if (accessLevel === ProjectAccessLevel.ADMIN || accessLevel === ProjectAccessLevel.OWNER) {
                return new Decision(AccessEnum.ACCESS_GRANTED, ['*']);
            } else {
                return new Decision(AccessEnum.ACCESS_DENIED);
            }
        }
    }

    private async canDelete(projectUser: ProjectUserEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canDelete] ${user.id} can delete a project-user relation?`);
        if (projectUser.user_id === user.id.toString()) {
            return new Decision(AccessEnum.ACCESS_GRANTED);
        } else if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED);
        } else {
            const accessLevel = await this.projectUserService
                .findAccessLevelOfUserInProject(user.id.toString(), projectUser.project_id.toString());
            if (accessLevel === ProjectAccessLevel.ADMIN || accessLevel === ProjectAccessLevel.OWNER) {
                return new Decision(AccessEnum.ACCESS_GRANTED);
            } else {
                return new Decision(AccessEnum.ACCESS_DENIED);
            }
        }
    }
}
