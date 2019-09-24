import { Decision } from '../voter/decision';

export interface AuthorizationCheckerInterface {
    isGranted(attributes: any[], subject?: any): Promise<Decision>;
}
