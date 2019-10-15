import { forwardRef, Inject, OnModuleInit } from '@nestjs/common';
import { AccessEnum } from './access.enum';
import { VoterInterface } from './voter.interface';
import { VoterRegistry } from './voter-registry';
import { Decision } from './decision';

export abstract class Voter implements VoterInterface, OnModuleInit {

    @Inject(forwardRef(() => VoterRegistry)) private readonly voterRegistry: VoterRegistry;

    public onModuleInit() {
        this.voterRegistry.register(this);
    }

    public async vote(token: any, subject: any, actions: any[]): Promise<Decision> {
        let decision: Decision = new Decision(AccessEnum.ACCESS_ABSTAIN);

        for (const action of actions) {
            if (!this.supports(action, subject)) {
                continue;
            }
            // as soon as at least one action is supported, default is to deny access
            decision = await this.voteOnAction(action, subject, token);
            if (decision.vote === AccessEnum.ACCESS_GRANTED) {
                // grant access as soon as at least one action returns a positive response
                return decision;
            }
        }

        return decision;
    }

    protected abstract supports(action, subject): boolean;

    protected async abstract voteOnAction(action, subject, token): Promise<Decision>;

}
