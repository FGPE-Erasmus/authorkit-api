import { AccessDecisionManagerInterface } from './access-decision-manager.interface';
import { AccessDecisionStrategyEnum } from './access-decision-strategy.enum';
import { AccessEnum, Voter, VoterRegistry } from '../voter';
import { ucfirst, filterObject } from '../../_helpers';
import { Decision } from '../voter/decision';

export class AccessDecisionManager implements AccessDecisionManagerInterface {

    private strategyMethod: string;

    constructor(
        private voterRegistry: VoterRegistry,
        /* private voters: IterableIterator<Voter>, */
        private strategy: AccessDecisionStrategyEnum = AccessDecisionStrategyEnum.STRATEGY_AFFIRMATIVE,
        private allowIfAllAbstainDecisions: boolean = false,
        private allowIfEqualGrantedDeniedDecisions: boolean = true
    ) {
        const strategyMethod = 'decide' + ucfirst(strategy);
        if (typeof this[strategyMethod] !== 'function') {
            throw new Error(`'The strategy "${strategyMethod}" is not supported.'`);
        }
        this.strategyMethod = strategyMethod;
    }

    public async decide(token, actions: any[], object: any): Promise<Decision> {
        return this[this.strategyMethod].call(this, token, actions, object);
    }

    private async decideAffirmative(token, actions, object): Promise<Decision> {
        let deny = 0;
        const votersArr = Array.from(this.voterRegistry.getVoters());
        for (const voter of votersArr) {
            const decision = await voter.vote(token, object, actions);
            switch (decision.vote) {
                case AccessEnum.ACCESS_GRANTED:
                    return decision;
                case AccessEnum.ACCESS_DENIED:
                    ++deny;
                    break;
                default:
                    break;
            }
        }
        if (deny > 0 || !this.allowIfAllAbstainDecisions) {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
        return new Decision(AccessEnum.ACCESS_GRANTED, ['*']);
    }

    private async decideConsensus(token, actions, object = null): Promise<Decision> {
        let grant = 0;
        let deny = 0;
        const attributesCounter = {};
        for (const voter of this.voterRegistry.getVoters()) {
            const decision = await voter.vote(token, object, actions);
            switch (decision.vote) {
                case AccessEnum.ACCESS_GRANTED:
                    ++grant;
                    decision.attributes.forEach((attr) => {
                        attributesCounter[attr] = (attributesCounter[attr] || 0) + 1;
                    });
                    break;
                case AccessEnum.ACCESS_DENIED:
                    ++deny;
                    break;
            }
        }
        if (grant > deny) {
            return new Decision(AccessEnum.ACCESS_GRANTED,
                Object.keys(filterObject(attributesCounter, (v) => v > (grant / 2))));
        }
        if (deny > grant) {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
        if (grant > 0) {
            if (this.allowIfEqualGrantedDeniedDecisions) {
                return new Decision(AccessEnum.ACCESS_GRANTED,
                    Object.keys(filterObject(attributesCounter, (v) => v > (grant / 2))));
            } else {
                return new Decision(AccessEnum.ACCESS_DENIED);
            }
        }
        if (this.allowIfAllAbstainDecisions) {
            return new Decision(AccessEnum.ACCESS_GRANTED,
                Object.keys(filterObject(attributesCounter, (v) => v > (grant / 2))));
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }

    private async decideUnanimous(token, actions, object = null): Promise<Decision> {
        let grant = 0;
        const attributes = [];
        for (const voter of this.voterRegistry.getVoters()) {
            for (const action of actions) {
                const decision = await voter.vote(token, object, [action]);
                switch (decision.vote) {
                    case AccessEnum.ACCESS_GRANTED:
                        ++grant;
                        attributes.push(...decision.attributes);
                        break;
                    case AccessEnum.ACCESS_DENIED:
                        return new Decision(AccessEnum.ACCESS_DENIED);
                    default:
                        break;
                }
            }
        }
        if (grant > 0) {
            return new Decision(AccessEnum.ACCESS_GRANTED, [...new Set(attributes)]);
        }
        if (this.allowIfAllAbstainDecisions) {
            return new Decision(AccessEnum.ACCESS_GRANTED, [...new Set(attributes)]);
        } else {
            return new Decision(AccessEnum.ACCESS_DENIED);
        }
    }
}
