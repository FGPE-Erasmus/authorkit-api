import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppLogger } from '../../app.logger';
import { GithubApiService } from '../../github-api/github-api.service';
import { UserEntity } from '../../user/entity/user.entity';

import { REWARD_CMD_CREATE, REWARD_CMD_UPDATE, REWARD_CMD_DELETE } from './reward.constants';
import { RewardEntity } from './entity/reward.entity';
import { GamificationLayerService } from '../gamification-layer.service';

@Controller()
export class RewardListener {

    private logger = new AppLogger(RewardListener.name);

    constructor(
        @InjectRepository(RewardEntity)
        protected readonly repository: Repository<RewardEntity>,
        protected readonly gamificationLayerService: GamificationLayerService,
        protected readonly githubApiService: GithubApiService
    ) { }

    @MessagePattern({ cmd: REWARD_CMD_CREATE })
    public async onRewardCreate(
        { user, reward }: { user: UserEntity, reward: RewardEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onRewardCreate] Create reward in Github repository`);
            const gamificationLayer = await this.gamificationLayerService.findOne(reward.gl_id);
            let path = `gamification-layers/${reward.gl_id}`;
            if (reward.challenge_id) {
                path += `/challenges/${reward.challenge_id}`;
            }
            path += `/rewards/${reward.id}/metadata.json`;
            const res = await this.githubApiService.createFile(
                user,
                gamificationLayer.project_id,
                path,
                {
                    id: reward.id,
                    name: reward.name,
                    description: reward.description,
                    kind: reward.kind,
                    amount: reward.amount,
                    revealables: [
                        ...reward.revealable_challenge_ids.map(id => ({ id, type: 'CHALLENGE' })),
                        ...reward.revealable_exercise_ids.map(id => ({ id, type: 'EXERCISE' }))
                    ],
                    unlockables: [
                        ...reward.unlockable_challenge_ids.map(id => ({ id, type: 'CHALLENGE' })),
                        ...reward.unlockable_exercise_ids.map(id => ({ id, type: 'EXERCISE' }))
                    ],
                    congratulations: reward.congratulations,
                    hints: reward.hints,
                    criteria: reward.criteria
                }
            );
            await this.repository.update(reward.id, { sha: res.content.sha });
            this.logger.debug('[onRewardCreate] Reward created in Github repository');
        } catch (err) {
            this.logger.error(`[onRewardCreate] Reward NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: REWARD_CMD_UPDATE })
    public async onRewardUpdate(
        { user, reward }: { user: UserEntity, reward: RewardEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onRewardUpdate] Update reward in Github repository`);
            const gamificationLayer = await this.gamificationLayerService.findOne(reward.gl_id);
            let path = `gamification-layers/${reward.gl_id}`;
            if (reward.challenge_id) {
                path += `/challenges/${reward.challenge_id}`;
            }
            path += `/rewards/${reward.id}/metadata.json`;
            const res = await this.githubApiService.updateFile(
                user,
                gamificationLayer.project_id,
                path,
                reward.sha,
                {
                    id: reward.id,
                    name: reward.name,
                    description: reward.description,
                    kind: reward.kind,
                    amount: reward.amount,
                    revealables: [
                        ...reward.revealable_challenge_ids.map(id => ({ id, type: 'CHALLENGE' })),
                        ...reward.revealable_exercise_ids.map(id => ({ id, type: 'EXERCISE' }))
                    ],
                    unlockables: [
                        ...reward.unlockable_challenge_ids.map(id => ({ id, type: 'CHALLENGE' })),
                        ...reward.unlockable_exercise_ids.map(id => ({ id, type: 'EXERCISE' }))
                    ],
                    congratulations: reward.congratulations,
                    hints: reward.hints,
                    criteria: reward.criteria
                }
            );
            await this.repository.update(reward.id, { sha: res.content.sha });
            this.logger.debug('[onRewardUpdate] Reward updated in Github repository');
        } catch (err) {
            this.logger.error(`[onRewardUpdate] Reward NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: REWARD_CMD_DELETE })
    public async onRewardDelete(
        { user, reward }: { user: UserEntity, reward: RewardEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onRewardDelete] Delete reward in Github repository`);
            const gamificationLayer = await this.gamificationLayerService.findOne(reward.gl_id);
            let path = `gamification-layers/${reward.gl_id}`;
            if (reward.challenge_id) {
                path += `/challenges/${reward.challenge_id}`;
            }
            path += `/rewards/${reward.id}/metadata.json`;
            await this.githubApiService.deleteFolder(
                user,
                gamificationLayer.project_id,
                path
            );
            this.logger.debug('[onRewardDelete] Reward deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onRewardDelete] Reward NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}

