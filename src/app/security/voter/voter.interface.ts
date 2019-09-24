import { Decision } from './decision';

export interface VoterInterface {
    vote(token: any, subject: any, actions: any[]): Promise<Decision>;
}
