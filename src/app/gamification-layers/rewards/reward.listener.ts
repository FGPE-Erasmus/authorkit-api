import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { AppLogger } from '../../app.logger';

import { REWARD_CMD_CREATE, REWARD_CMD_UPDATE, REWARD_CMD_DELETE } from './reward.constants';
import { RewardEntity } from './entity/reward.entity';

@Controller()
export class RewardListener {

    private logger = new AppLogger(RewardListener.name);

    constructor() { }

    @MessagePattern({ cmd: REWARD_CMD_CREATE })
    public async onRewardCreate(reward: RewardEntity): Promise<void> {
        try {
            this.logger.debug(`[onRewardCreate] Create leaderboard in Github repository`);
            // TODO
            this.logger.debug('[onRewardCreate] Reward created in Github repository');
        } catch (err) {
            this.logger.error(`[onRewardCreate] Reward NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: REWARD_CMD_UPDATE })
    public async onRewardUpdate(reward: RewardEntity): Promise<void> {
        try {
            this.logger.debug(`[onRewardUpdate] Update leaderboard in Github repository`);
            // TODO
            this.logger.debug('[onRewardUpdate] Reward updated in Github repository');
        } catch (err) {
            this.logger.error(`[onRewardUpdate] Reward NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: REWARD_CMD_DELETE })
    public async onRewardDelete(reward: RewardEntity): Promise<void> {
        try {
            this.logger.debug(`[onRewardDelete] Delete leaderboard in Github repository`);
            // TODO
            this.logger.debug('[onRewardDelete] Reward deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onRewardDelete] Reward NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}

