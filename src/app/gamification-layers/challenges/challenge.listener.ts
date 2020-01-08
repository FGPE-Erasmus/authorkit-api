import { Injectable, Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../../app.logger';

import { CHALLENGE_CMD_CREATE, CHALLENGE_CMD_UPDATE, CHALLENGE_CMD_DELETE } from './challenge.constants';

@Controller()
export class ChallengeListener {

    private logger = new AppLogger(ChallengeListener.name);

    constructor() { }

    @MessagePattern({ cmd: CHALLENGE_CMD_CREATE })
    public async onChallengeCreate(): Promise<void> {
        try {
            this.logger.debug(`[onChallengeCreate] Create challenge in Github repository`);
            // TODO
            this.logger.debug('[onChallengeCreate] Challenge created in Github repository');
        } catch (err) {
            this.logger.error(`[onChallengeCreate] Challenge NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: CHALLENGE_CMD_UPDATE })
    public async onChallengeUpdate(): Promise<void> {
        try {
            this.logger.debug(`[onChallengeUpdate] Update challenge in Github repository`);
            // TODO
            this.logger.debug('[onChallengeUpdate] Challenge updated in Github repository');
        } catch (err) {
            this.logger.error(`[onChallengeUpdate] Challenge NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: CHALLENGE_CMD_DELETE })
    public async onChallengeDelete(): Promise<void> {
        try {
            this.logger.debug(`[onChallengeDelete] Update challenge in Github repository`);
            // TODO
            this.logger.debug('[onChallengeDelete] Challenge updated in Github repository');
        } catch (err) {
            this.logger.error(`[onChallengeDelete] Challenge NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

}

