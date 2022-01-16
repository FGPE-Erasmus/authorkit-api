import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../../app.logger';
import { GithubApiService } from '../../github-api/github-api.service';
import { GamificationLayerService } from '../gamification-layer.service';

import {
    LEADERBOARD_SYNC_QUEUE,
    LEADERBOARD_SYNC_CREATE,
    LEADERBOARD_SYNC_UPDATE,
    LEADERBOARD_SYNC_DELETE
} from './leaderboard.constants';
import { LeaderboardEntity } from './entity/leaderboard.entity';

@Processor(LEADERBOARD_SYNC_QUEUE)
export class LeaderboardSyncProcessor {

    private logger = new AppLogger(LeaderboardSyncProcessor.name);

    constructor(
        @InjectRepository(LeaderboardEntity)
        protected readonly repository: Repository<LeaderboardEntity>,
        protected readonly gamificationLayerService: GamificationLayerService,
        protected readonly githubApiService: GithubApiService
    ) { }

    @Process(LEADERBOARD_SYNC_CREATE)
    public async onLeaderboardCreate(job: Job) {
        this.logger.debug(`[onLeaderboardCreate] Create leaderboard in Github repository`);
        const { user, leaderboard } = job.data;
        const gamificationLayer = await this.gamificationLayerService.findOne(leaderboard.gl_id);
        let path = `gamification-layers/${leaderboard.gl_id}`;
        if (leaderboard.challenge_id) {
            path += `/challenges/${leaderboard.challenge_id}`;
        }
        path += `/leaderboards/${leaderboard.id}/metadata.json`;
        const res = await this.githubApiService.createFile(
            user,
            gamificationLayer.project_id,
            path,
            Buffer.from(JSON.stringify({
                id: leaderboard.id,
                name: leaderboard.name,
                groups: leaderboard.groups,
                metrics: leaderboard.metrics,
                sorting_orders: leaderboard.sorting_orders?.toUpperCase()
            })).toString('base64')
        );
        await this.repository.update(leaderboard.id, { sha: res.content.sha });
        this.logger.debug('[onLeaderboardCreate] Leaderboard created in Github repository');
    }

    @Process(LEADERBOARD_SYNC_UPDATE)
    public async onLeaderboardUpdate(job: Job) {
        this.logger.debug(`[onLeaderboardUpdate] Update leaderboard in Github repository`);
        const { user, leaderboard } = job.data;
        const gamificationLayer = await this.gamificationLayerService.findOne(leaderboard.gl_id);
        let path = `gamification-layers/${leaderboard.gl_id}`;
        if (leaderboard.challenge_id) {
            path += `/challenges/${leaderboard.challenge_id}`;
        }
        path += `/leaderboards/${leaderboard.id}/metadata.json`;
        const res = await this.githubApiService.updateFile(
            user,
            gamificationLayer.project_id,
            path,
            leaderboard.sha,
            Buffer.from(JSON.stringify({
                id: leaderboard.id,
                name: leaderboard.name,
                groups: leaderboard.groups,
                metrics: leaderboard.metrics,
                sorting_orders: leaderboard.sorting_orders?.toUpperCase()
            })).toString('base64')
        );
        await this.repository.update(leaderboard.id, { sha: res.content.sha });
        this.logger.debug('[onLeaderboardUpdate] Leaderboard updated in Github repository');
    }

    @Process(LEADERBOARD_SYNC_DELETE)
    public async onLeaderboardDelete(job: Job): Promise<void> {
        this.logger.debug(`[onLeaderboardDelete] Delete leaderboard in Github repository`);
        const { user, leaderboard } = job.data;
        const gamificationLayer = await this.gamificationLayerService.findOne(leaderboard.gl_id);
        let path = `gamification-layers/${leaderboard.gl_id}`;
        if (leaderboard.challenge_id) {
            path += `/challenges/${leaderboard.challenge_id}`;
        }
        path += `/leaderboards/${leaderboard.id}/metadata.json`;
        await this.githubApiService.deleteFolder(
            user,
            gamificationLayer.project_id,
            path
        );
        this.logger.debug('[onLeaderboardDelete] Leaderboard deleted in Github repository');
    }
}
