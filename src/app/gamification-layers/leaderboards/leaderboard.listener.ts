import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppLogger } from '../../app.logger';
import { UserEntity } from '../../user/entity/user.entity';
import { GithubApiService } from '../../github-api/github-api.service';
import { GamificationLayerService } from '../gamification-layer.service';

import { LEADERBOARD_CMD_CREATE, LEADERBOARD_CMD_UPDATE, LEADERBOARD_CMD_DELETE } from './leaderboard.constants';
import { LeaderboardEntity } from './entity/leaderboard.entity';

@Controller()
export class LeaderboardListener {

    private logger = new AppLogger(LeaderboardListener.name);

    constructor(
        @InjectRepository(LeaderboardEntity)
        protected readonly repository: Repository<LeaderboardEntity>,
        protected readonly gamificationLayerService: GamificationLayerService,
        protected readonly githubApiService: GithubApiService
    ) { }

    @MessagePattern({ cmd: LEADERBOARD_CMD_CREATE })
    public async onLeaderboardCreate(
        { user, leaderboard }: { user: UserEntity, leaderboard: LeaderboardEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onLeaderboardCreate] Create leaderboard in Github repository`);
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
                {
                    id: leaderboard.id,
                    name: leaderboard.name,
                    metrics: leaderboard.metrics,
                    sorting_orders: leaderboard.sorting_orders
                }
            );
            await this.repository.update(leaderboard.id, { sha: res.content.sha });
            this.logger.debug('[onLeaderboardCreate] Leaderboard created in Github repository');
        } catch (err) {
            this.logger.error(`[onLeaderboardCreate] Leaderboard NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: LEADERBOARD_CMD_UPDATE })
    public async onLeaderboardUpdate(
        { user, leaderboard }: { user: UserEntity, leaderboard: LeaderboardEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onLeaderboardUpdate] Update leaderboard in Github repository`);
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
                {
                    id: leaderboard.id,
                    name: leaderboard.name,
                    metrics: leaderboard.metrics,
                    sorting_orders: leaderboard.sorting_orders
                }
            );
            await this.repository.update(leaderboard.id, { sha: res.content.sha });
            this.logger.debug('[onLeaderboardUpdate] Leaderboard updated in Github repository');
        } catch (err) {
            this.logger.error(`[onLeaderboardUpdate] Leaderboard NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: LEADERBOARD_CMD_DELETE })
    public async onLeaderboardDelete(
        { user, leaderboard }: { user: UserEntity, leaderboard: LeaderboardEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onLeaderboardDelete] Delete leaderboard in Github repository`);
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
        } catch (err) {
            this.logger.error(`[onLeaderboardDelete] Leaderboard NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}

