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
        const { user, gamification_layer } = job.data;
        const res = await this.githubApiService.createFile(
            user,
            gamification_layer.project_id,
            `gamification-layers/${gamification_layer.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: gamification_layer.id,
                name: gamification_layer.name,
                description: gamification_layer.description,
                keywords: gamification_layer.keywords,
                status: gamification_layer.status
            })).toString('base64')
        );
        await this.repository.update(gamification_layer.id, { sha: res.content.sha });
        this.logger.debug('[onGamificationLayerCreate] Gamification layer created in Github repository');
    }

    @Process(GAMIFICATION_LAYER_SYNC_UPDATE)
    public async onGamificationLayerUpdate(job: Job) {
        this.logger.debug(`[onGamificationLayerUpdate] Update gamification layer in Github repository`);
        const { user, gamification_layer } = job.data;
        this.logger.debug(JSON.stringify(classToPlain(gamification_layer)));
        const res = await this.githubApiService.updateFile(
            user,
            gamification_layer.project_id,
            `gamification-layers/${gamification_layer.id}/metadata.json`,
            gamification_layer.sha,
            Buffer.from(JSON.stringify({
                id: gamification_layer.id,
                name: gamification_layer.name,
                description: gamification_layer.description,
                keywords: gamification_layer.keywords,
                status: gamification_layer.status
            })).toString('base64')
        );
        await this.repository.update(gamification_layer.id, { sha: res.content.sha });
        this.logger.debug('[onGamificationLayerUpdate] Gamification layer updated in Github repository');
    }

    @Process(GAMIFICATION_LAYER_SYNC_DELETE)
    public async onGamificationLayerDelete(job: Job) {
        this.logger.debug(`[onGamificationLayerDelete] Delete gamification layer in Github repository`);
        const { user, gamification_layer } = job.data;
        await this.githubApiService.deleteFolder(
            user,
            gamification_layer.project_id,
            `gamification-layers/${gamification_layer.id}`
        );
        this.logger.debug('[onGamificationLayerDelete] Gamification layer deleted in Github repository');
    }
}

