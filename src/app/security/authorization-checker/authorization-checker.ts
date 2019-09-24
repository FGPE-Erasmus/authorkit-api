import { AuthorizationCheckerInterface } from './authorization-checker.interface';
import { AccessDecisionManager, AccessDecisionStrategyEnum } from '../access-decision';
import { Injectable } from '@nestjs/common';
import { VoterRegistry } from '../voter';
import { RequestContext } from '../../_helpers/request-context';

@Injectable()
export class AuthorizationChecker implements AuthorizationCheckerInterface {
    private readonly adm: AccessDecisionManager;
    private readonly tokenStorage;

    constructor(voterRegistry: VoterRegistry) {
        this.adm = new AccessDecisionManager(voterRegistry,
            AccessDecisionStrategyEnum.STRATEGY_AFFIRMATIVE, true);
        this.tokenStorage = function () {
            return {
                getUser: () => RequestContext.currentUser()
            };
        };
    }

    public async isGranted(actions, subject = null) {
        const token = this.tokenStorage();

        if (!Array.isArray(actions)) {
            actions = [actions];
        }

        return this.adm.decide(token, actions, subject);
    }
}
