import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppLogger } from '../app.logger';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity';

import {
    GAMIFICATION_LAYER_CMD_CREATE,
    GAMIFICATION_LAYER_CMD_UPDATE,
    GAMIFICATION_LAYER_CMD_DELETE
} from './gamification-layer.constants';
import { GamificationLayerEntity } from './entity/gamification-layer.entity';
import { GamificationLayerService } from './gamification-layer.service';
import { classToPlain } from 'class-transformer';

@Controller()
export class GamificationLayerListener {

    private logger = new AppLogger(GamificationLayerListener.name);

    constructor(
        @InjectRepository(GamificationLayerEntity)
        protected readonly repository: Repository<GamificationLayerEntity>,
        protected readonly service: GamificationLayerService,
        protected readonly githubApiService: GithubApiService
    ) { }

    @MessagePattern({ cmd: GAMIFICATION_LAYER_CMD_CREATE })
    public async onGamificationLayerCreate(
        { user, gamificationLayer }: { user: UserEntity, gamificationLayer: GamificationLayerEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onGamificationLayerCreate] Create gamification layer in Github repository`);
            const res = await this.githubApiService.createFile(
                user,
                gamificationLayer.project_id,
                `gamification-layers/${gamificationLayer.id}/metadata.json`,
                {
                    id: gamificationLayer.id,
                    name: gamificationLayer.name,
                    description: gamificationLayer.description,
                    keywords: gamificationLayer.keywords,
                    status: gamificationLayer.status
                }
            );
            await this.repository.update(gamificationLayer.id, { sha: res.content.sha });
            this.logger.debug('[onGamificationLayerCreate] Gamification layer created in Github repository');
        } catch (err) {
            this.logger.error(
                `[onGamificationLayerCreate] GamificationLayer NOT created in Github repository, because ${err.message}`,
                err.stack
            );
        }
    }

    @MessagePattern({ cmd: GAMIFICATION_LAYER_CMD_UPDATE })
    public async onGamificationLayerUpdate(
        { user, gamificationLayer }: { user: UserEntity, gamificationLayer: GamificationLayerEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onGamificationLayerUpdate] Update gamification layer in Github repository`);
            this.logger.debug(JSON.stringify(classToPlain(gamificationLayer)));
            const res = await this.githubApiService.updateFile(
                user,
                gamificationLayer.project_id,
                `gamification-layers/${gamificationLayer.id}/metadata.json`,
                gamificationLayer.sha,
                {
                    id: gamificationLayer.id,
                    name: gamificationLayer.name,
                    description: gamificationLayer.description,
                    keywords: gamificationLayer.keywords,
                    status: gamificationLayer.status
                }
            );
            await this.repository.update(gamificationLayer.id, { sha: res.content.sha });
            this.logger.debug('[onGamificationLayerUpdate] Gamification layer updated in Github repository');
        } catch (err) {
            this.logger.error(
                `[onGamificationLayerUpdate] Gamification layer NOT updated in Github repository, because ${err.message}`,
                err.stack
            );
        }
    }

    @MessagePattern({ cmd: GAMIFICATION_LAYER_CMD_DELETE })
    public async onGamificationLayerDelete(
        { user, gamificationLayer }: { user: UserEntity, gamificationLayer: GamificationLayerEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onGamificationLayerDelete] Delete gamification layer in Github repository`);
            await this.githubApiService.deleteFolder(
                user,
                gamificationLayer.project_id,
                `gamification-layers/${gamificationLayer.id}`
            );
            this.logger.debug('[onGamificationLayerDelete] Gamification layer deleted in Github repository');
        } catch (err) {
            this.logger.error(
                `[onGamificationLayerDelete] Gamification layer NOT deleted in Github repository, because ${err.message}`,
                err.stack
            );
        }
    }
}

