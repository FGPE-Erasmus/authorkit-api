import { AccessEnum } from './access.enum';

export class Decision {
    vote: AccessEnum;
    attributes: string[];

    constructor(vote: AccessEnum, attributes?: string[]) {
        this.vote = vote;
        this.attributes = attributes;
    }
}
