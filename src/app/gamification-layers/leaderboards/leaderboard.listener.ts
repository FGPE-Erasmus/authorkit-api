import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../../app.logger';

import { LEADERBOARD_CMD_CREATE, LEADERBOARD_CMD_UPDATE, LEADERBOARD_CMD_DELETE } from './leaderboard.constants';
import { LeaderboardEntity } from './entity/leaderboard.entity';

@Controller()
export class LeaderboardListener {

    private logger = new AppLogger(LeaderboardListener.name);

    constructor() { }

    @MessagePattern({ cmd: LEADERBOARD_CMD_CREATE })
    public async onLeaderboardCreate(leaderboard: LeaderboardEntity): Promise<void> {
        try {
            this.logger.debug(`[onLeaderboardCreate] Create leaderboard in Github repository`);
            // TODO
            this.logger.debug('[onLeaderboardCreate] Leaderboard created in Github repository');
        } catch (err) {
            this.logger.error(`[onLeaderboardCreate] Leaderboard NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: LEADERBOARD_CMD_UPDATE })
    public async onLeaderboardUpdate(leaderboard: LeaderboardEntity): Promise<void> {
        try {
            this.logger.debug(`[onLeaderboardUpdate] Update leaderboard in Github repository`);
            // TODO
            this.logger.debug('[onLeaderboardUpdate] Leaderboard updated in Github repository');
        } catch (err) {
            this.logger.error(`[onLeaderboardUpdate] Leaderboard NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: LEADERBOARD_CMD_DELETE })
    public async onLeaderboardDelete(leaderboard: LeaderboardEntity): Promise<void> {
        try {
            this.logger.debug(`[onLeaderboardDelete] Delete leaderboard in Github repository`);
            // TODO
            this.logger.debug('[onLeaderboardDelete] Leaderboard deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onLeaderboardDelete] Leaderboard NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}

