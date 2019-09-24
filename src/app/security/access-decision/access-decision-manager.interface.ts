import { Decision } from '../voter/decision';

export interface AccessDecisionManagerInterface {
    decide(token, actions: any[], object: any): Promise<Decision>;
}
