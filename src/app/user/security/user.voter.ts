import { Injectable } from '@nestjs/common';
import { AccessLevelEnum, RestVoterActionEnum, Voter, AccessEnum } from '../../security';
import { AppLogger } from '../../app.logger';
import { UserService } from '../user.service';
import { UserEntity, UserRole } from '../entity';
import { Decision } from '../../security/voter/decision';

@Injectable()
export class UserVoter extends Voter {

    private logger = new AppLogger(UserVoter.name);

    private readonly actions = [
        RestVoterActionEnum.READ_ALL,
        RestVoterActionEnum.READ,
        RestVoterActionEnum.CREATE,
        RestVoterActionEnum.UPDATE,
        RestVoterActionEnum.SOFT_DELETE,
        RestVoterActionEnum.DELETE
    ];

    private readonly readableProperties = {
        [AccessLevelEnum.USER]: ['id', 'first_name', 'last_name', 'institution', 'country'],
        [AccessLevelEnum.OWNER]: ['id', 'first_name', 'last_name', 'institution', 'country', 'email', 'phone_num', 'profile_img', 'is_verified', 'provider', 'facebook_id', 'google_id', 'twitter_id', 'github_id', 'online_at', 'created_at', 'updated_at', 'is_deleted'],
        [AccessLevelEnum.ADMIN]: ['id', 'first_name', 'last_name', 'institution', 'country', 'email', 'phone_num', 'profile_img', 'is_verified', 'roles', 'provider', 'facebook_id', 'google_id', 'twitter_id', 'github_id', 'online_at', 'created_at', 'updated_at', 'is_deleted']
    };

    private readonly mutableProperties = {
        [AccessLevelEnum.USER]: [],
        [AccessLevelEnum.OWNER]: ['first_name', 'last_name', 'institution', 'country', 'email', 'phone_num', 'profile_img', 'facebook_id', 'google_id', 'twitter_id', 'github_id'],
        [AccessLevelEnum.ADMIN]: ['first_name', 'last_name', 'institution', 'country', 'email', 'password', 'phone_num', 'profile_img', 'is_verified', 'roles', 'provider', 'facebook_id', 'google_id', 'twitter_id', 'github_id', 'online_at']
    };

    constructor(private readonly userService: UserService) {
        super();
    }

    protected supports(action: any, subject: any): boolean {

        if (!this.actions.includes(action)) {
            return false;
        }

        if (Array.isArray(subject)) {
            return subject.every(element => element instanceof UserEntity);
        }

        return subject instanceof UserEntity;
    }

    protected async voteOnAction(action, subject: UserEntity | UserEntity[], context): Promise<Decision> {
        const user = context.getUser();

        switch (action) {
            case RestVoterActionEnum.READ_ALL:
                return this.canReadAll(subject as UserEntity[], user);
            case RestVoterActionEnum.READ:
                return this.canRead(subject as UserEntity, user);
            case RestVoterActionEnum.CREATE:
                return this.canCreate(subject as UserEntity, user);
            case RestVoterActionEnum.UPDATE:
                return this.canUpdate(subject as UserEntity, user);
            case RestVoterActionEnum.DELETE:
                return this.canDelete(subject as UserEntity, user);
            case RestVoterActionEnum.SOFT_DELETE:
                return this.canSoftDelete(subject as UserEntity, user);
        }

        return Promise.resolve(new Decision(AccessEnum.ACCESS_DENIED));
    }

    /** REST Actions */

    private async canReadAll(users: UserEntity[], user: UserEntity): Promise<Decision> {
        this.logger.debug('[canReadAll] admins can read all users');
        if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.readableProperties[AccessLevelEnum.ADMIN]);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }

    private async canRead(otherUser: UserEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canRead] only the user itself or admins can read ${otherUser.id}`);
        if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.readableProperties[AccessLevelEnum.ADMIN]);
        } else if (otherUser.id && user.id && otherUser.id.toString() === user.id.toString()) {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.readableProperties[AccessLevelEnum.OWNER]);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }

    private async canCreate(otherUser: UserEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug('[canCreate] admins can create users');
        if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.mutableProperties[AccessLevelEnum.ADMIN]);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }

    private async canUpdate(otherUser: UserEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canUpdate] only the user itself or admins can update ${otherUser.id}`);
        if (user.roles.includes(UserRole.ADMIN)) {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.mutableProperties[AccessLevelEnum.ADMIN]);
        } else if (otherUser.id && user.id && otherUser.id.toString() === user.id.toString()) {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.mutableProperties[AccessLevelEnum.OWNER]);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }

    private async canDelete(otherUser: UserEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canDelete] only the user itself or admins can delete ${otherUser.id}`);
        if (user.roles.includes(UserRole.ADMIN) || otherUser.id === user.id) {
            return new Decision(AccessEnum.ACCESS_GRANTED);
        } else if (otherUser.id && user.id && otherUser.id.toString() === user.id.toString()) {
            return new Decision(AccessEnum.ACCESS_GRANTED, this.mutableProperties[AccessLevelEnum.OWNER]);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }

    private async canSoftDelete(otherUser: UserEntity, user: UserEntity): Promise<Decision> {
        this.logger.debug(`[canSoftDelete] only the user itself or admins can thrash ${otherUser.id}`);
        if (user.roles.includes(UserRole.ADMIN) || otherUser.id === user.id) {
            return new Decision(AccessEnum.ACCESS_GRANTED);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }
}
