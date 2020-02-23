import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { classToPlain } from 'class-transformer';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';

import {
    GAMIFICATION_LAYER_SYNC_QUEUE,
    GAMIFICATION_LAYER_SYNC_CREATE,
    GAMIFICATION_LAYER_SYNC_UPDATE,
    GAMIFICATION_LAYER_SYNC_DELETE
} from './gamification-layer.constants';
import { GamificationLayerEntity } from './entity/gamification-layer.entity';
import { GamificationLayerService } from './gamification-layer.service';

@Processor(GAMIFICATION_LAYER_SYNC_QUEUE)
export class GamificationLayerSyncProcessor {

    private logger = new AppLogger(GamificationLayerSyncProcessor.name);

    constructor(
        @InjectRepository(GamificationLayerEntity)
        protected readonly repository: Repository<GamificationLayerEntity>,
        protected readonly service: GamificationLayerService,
        protected readonly githubApiService: GithubApiService
    ) { }

    @Process(GAMIFICATION_LAYER_SYNC_CREATE)
    public async onGamificationLayerCreate(job: Job) {
        this.logger.debug(`[onGamificationLayerCreate] Create gamification layer in Github repository`);
        const { user, gamificationLayer } = job.data;
        const res = await this.githubApiService.createFile(
            user,
            gamificationLayer.project_id,
            `gamification-layers/${gamificationLayer.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: gamificationLayer.id,
                name: gamificationLayer.name,
                description: gamificationLayer.description,
                keywords: gamificationLayer.keywords,
                status: gamificationLayer.status
            })).toString('base64')
        );
        await this.repository.update(gamificationLayer.id, { sha: res.content.sha });
        this.logger.debug('[onGamificationLayerCreate] Gamification layer created in Github repository');
    }

    @Process(GAMIFICATION_LAYER_SYNC_UPDATE)
    public async onGamificationLayerUpdate(job: Job) {
        this.logger.debug(`[onGamificationLayerUpdate] Update gamification layer in Github repository`);
        const { user, gamificationLayer } = job.data;
        this.logger.debug(JSON.stringify(classToPlain(gamificationLayer)));
        const res = await this.githubApiService.updateFile(
            user,
            gamificationLayer.project_id,
            `gamification-layers/${gamificationLayer.id}/metadata.json`,
            gamificationLayer.sha,
            Buffer.from(JSON.stringify({
                id: gamificationLayer.id,
                name: gamificationLayer.name,
                description: gamificationLayer.description,
                keywords: gamificationLayer.keywords,
                status: gamificationLayer.status
            })).toString('base64')
        );
        await this.repository.update(gamificationLayer.id, { sha: res.content.sha });
        this.logger.debug('[onGamificationLayerUpdate] Gamification layer updated in Github repository');
    }

    @Process(GAMIFICATION_LAYER_SYNC_DELETE)
    public async onGamificationLayerDelete(job: Job) {
        this.logger.debug(`[onGamificationLayerDelete] Delete gamification layer in Github repository`);
        const { user, gamificationLayer } = job.data;
        await this.githubApiService.deleteFolder(
            user,
            gamificationLayer.project_id,
            `gamification-layers/${gamificationLayer.id}`
        );
        this.logger.debug('[onGamificationLayerDelete] Gamification layer deleted in Github repository');
    }
}

