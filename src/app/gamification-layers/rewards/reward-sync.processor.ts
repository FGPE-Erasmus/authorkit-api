import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../../app.logger';
import { GitService } from '../../git/git.service';

import {
    REWARD_SYNC_QUEUE,
    REWARD_SYNC_CREATE,
    REWARD_SYNC_UPDATE,
    REWARD_SYNC_DELETE
} from './reward.constants';
import { RewardEntity } from './entity/reward.entity';
import { GamificationLayerService } from '../gamification-layer.service';

@Processor(REWARD_SYNC_QUEUE)
export class RewardSyncProcessor {
    private logger = new AppLogger(RewardSyncProcessor.name);

    constructor(
        @InjectRepository(RewardEntity)
        protected readonly repository: Repository<RewardEntity>,
        protected readonly gamificationLayerService: GamificationLayerService,
        protected readonly gitService: GitService
    ) {}

    @Process(REWARD_SYNC_CREATE)
    public async onRewardCreate(job: Job) {
        this.logger.debug(
            `[onRewardCreate] Create reward in Github repository`
        );
        const { user, reward } = job.data;
        const gamificationLayer = await this.gamificationLayerService.findOne(
            reward.gl_id
        );
        let path = `gamification-layers/${reward.gl_id}`;
        if (reward.challenge_id) {
            path += `/challenges/${reward.challenge_id}`;
        }
        path += `/rewards/${reward.id}/metadata.json`;
        const res = await this.gitService.createFile(
            user,
            gamificationLayer.project_id,
            path,
            Buffer.from(
                JSON.stringify({
                    id: reward.id,
                    name: reward.name,
                    description: reward.description,
                    kind: reward.kind?.toUpperCase(),
                    recurrent: reward.recurrent,
                    image: reward.image,
                    cost: reward.cost,
                    amount: reward.amount,
                    challenges: [...reward.challenge_ids],
                    message: reward.message
                })
            ).toString('base64')
        );
        await this.repository.update(reward.id, { sha: res });
        this.logger.debug(
            '[onRewardCreate] Reward created in Github repository'
        );
    }

    @Process(REWARD_SYNC_UPDATE)
    public async onRewardUpdate(job: Job) {
        this.logger.debug(
            `[onRewardUpdate] Update reward in Github repository`
        );
        const { user, reward } = job.data;
        const gamificationLayer = await this.gamificationLayerService.findOne(
            reward.gl_id
        );
        let path = `gamification-layers/${reward.gl_id}`;
        if (reward.challenge_id) {
            path += `/challenges/${reward.challenge_id}`;
        }
        path += `/rewards/${reward.id}/metadata.json`;
        const res = await this.gitService.updateFile(
            user,
            gamificationLayer.project_id,
            path,
            Buffer.from(
                JSON.stringify({
                    id: reward.id,
                    name: reward.name,
                    description: reward.description,
                    kind: reward.kind?.toUpperCase(),
                    recurrent: reward.recurrent,
                    image: reward.image,
                    cost: reward.cost,
                    amount: reward.amount,
                    challenges: [...reward.challenge_ids],
                    message: reward.message
                })
            ).toString('base64')
        );
        await this.repository.update(reward.id, { sha: res });
        this.logger.debug(
            '[onRewardUpdate] Reward updated in Github repository'
        );
    }

    @Process(REWARD_SYNC_DELETE)
    public async onRewardDelete(job: Job) {
        this.logger.debug(
            `[onRewardDelete] Delete reward in Github repository`
        );
        const { user, reward } = job.data;
        const gamificationLayer = await this.gamificationLayerService.findOne(
            reward.gl_id
        );
        let path = `gamification-layers/${reward.gl_id}`;
        if (reward.challenge_id) {
            path += `/challenges/${reward.challenge_id}`;
        }
        path += `/rewards/${reward.id}/metadata.json`;
        await this.gitService.deleteFolder(
            user,
            gamificationLayer.project_id,
            path
        );
        this.logger.debug(
            '[onRewardDelete] Reward deleted in Github repository'
        );
    }
}
