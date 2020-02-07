import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppLogger } from '../../app.logger';
import { GithubApiService } from '../../github-api/github-api.service';
import { UserEntity } from '../../user/entity/user.entity';
import { GamificationLayerService } from '../gamification-layer.service';

import { RULE_CMD_CREATE, RULE_CMD_UPDATE, RULE_CMD_DELETE } from './rule.constants';
import { RuleEntity } from './entity/rule.entity';

@Controller()
export class RuleListener {

    private logger = new AppLogger(RuleListener.name);

    constructor(
        @InjectRepository(RuleEntity)
        protected readonly repository: Repository<RuleEntity>,
        protected readonly gamificationLayerService: GamificationLayerService,
        protected readonly githubApiService: GithubApiService
    ) { }

    @MessagePattern({ cmd: RULE_CMD_CREATE })
    public async onRuleCreate(
        { user, rule }: { user: UserEntity, rule: RuleEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onRuleCreate] Create rule in Github repository`);
            const gamificationLayer = await this.gamificationLayerService.findOne(rule.gl_id);
            let path = `gamification-layers/${rule.gl_id}`;
            if (rule.challenge_id) {
                path += `/challenges/${rule.challenge_id}`;
            }
            path += `/rules/${rule.id}/metadata.json`;
            const res = await this.githubApiService.createFile(
                user,
                gamificationLayer.project_id,
                path,
                {
                    id: rule.id,
                    name: rule.name,
                    criteria: rule.criteria,
                    actions: rule.actions
                }
            );
            await this.repository.update(rule.id, { sha: res.content.sha });
            this.logger.debug('[onRuleCreate] Rule created in Github repository');
        } catch (err) {
            this.logger.error(`[onRuleCreate] Rule NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: RULE_CMD_UPDATE })
    public async onRuleUpdate(
        { user, rule }: { user: UserEntity, rule: RuleEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onRuleUpdate] Update rule in Github repository`);
            const gamificationLayer = await this.gamificationLayerService.findOne(rule.gl_id);
            let path = `gamification-layers/${rule.gl_id}`;
            if (rule.challenge_id) {
                path += `/challenges/${rule.challenge_id}`;
            }
            path += `/rules/${rule.id}/metadata.json`;
            const res = await this.githubApiService.createFile(
                user,
                gamificationLayer.project_id,
                path,
                {
                    id: rule.id,
                    name: rule.name,
                    criteria: rule.criteria,
                    actions: rule.actions
                }
            );
            await this.repository.update(rule.id, { sha: res.content.sha });
            this.logger.debug('[onRuleUpdate] Rule updated in Github repository');
        } catch (err) {
            this.logger.error(`[onRuleUpdate] Rule NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: RULE_CMD_DELETE })
    public async onRuleDelete(
        { user, rule }: { user: UserEntity, rule: RuleEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onRuleDelete] Delete rule in Github repository`);
            const gamificationLayer = await this.gamificationLayerService.findOne(rule.gl_id);
            let path = `gamification-layers/${rule.gl_id}`;
            if (rule.challenge_id) {
                path += `/challenges/${rule.challenge_id}`;
            }
            path += `/rules/${rule.id}/metadata.json`;
            await this.githubApiService.deleteFolder(
                user,
                gamificationLayer.project_id,
                path
            );
            this.logger.debug('[onRuleDelete] Rule deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onRuleDelete] Rule NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}

