import { ForbiddenException, Injectable } from '@nestjs/common';
import { dropUnallowed } from '../_helpers';
import { AuthorizationChecker } from './authorization-checker';
import { Decision } from './voter/decision';
import { AccessEnum } from './voter';

@Injectable()
export class SecurityService {

    constructor(private readonly authorizationChecker: AuthorizationChecker) {
    }

    public async denyAccessUnlessGranted(actions, subject): Promise<Decision> {
        const decision = await this.authorizationChecker.isGranted(actions, subject);
        if (decision.vote !== AccessEnum.ACCESS_GRANTED) {
            throw new ForbiddenException(`You don't have permission to access this resource`);
        }
        return decision;
    }

    public async removeNonAllowedProperties(subject, allowed): Promise<void> {
        if (allowed === undefined || allowed.includes('*')) {
            return subject;
        }
        dropUnallowed(subject, allowed);
    }
}
