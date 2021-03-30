import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../../app.logger';
import { GithubApiService } from '../../github-api/github-api.service';
import { GamificationLayerService } from '../gamification-layer.service';

import {
    RULE_SYNC_QUEUE,
    RULE_SYNC_CREATE,
    RULE_SYNC_UPDATE,
    RULE_SYNC_DELETE
} from './rule.constants';
import { RuleEntity } from './entity/rule.entity';

@Processor(RULE_SYNC_QUEUE)
export class RuleSyncProcessor {

    private logger = new AppLogger(RuleSyncProcessor.name);

    constructor(
        @InjectRepository(RuleEntity)
        protected readonly repository: Repository<RuleEntity>,
        protected readonly gamificationLayerService: GamificationLayerService,
        protected readonly githubApiService: GithubApiService
    ) { }

    @Process(RULE_SYNC_CREATE)
    public async onRuleCreate(job: Job) {
        // this.logger.debug(`[onRuleCreate] Create rule in Github repository`);
        const { user, rule } = job.data;
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
            Buffer.from(JSON.stringify({
                id: rule.id,
                name: rule.name,
                triggers: rule.triggers,
                criteria: rule.criteria,
                actions: rule.actions
            })).toString('base64')
        );
        await this.repository.update(rule.id, { sha: res.content.sha });
        // this.logger.debug('[onRuleCreate] Rule created in Github repository');
    }

    @Process(RULE_SYNC_UPDATE)
    public async onRuleUpdate(job: Job) {
        this.logger.debug(`[onRuleUpdate] Update rule in Github repository`);
        const { user, rule } = job.data;
        const gamificationLayer = await this.gamificationLayerService.findOne(rule.gl_id);
        let path = `gamification-layers/${rule.gl_id}`;
        if (rule.challenge_id) {
            path += `/challenges/${rule.challenge_id}`;
        }
        path += `/rules/${rule.id}/metadata.json`;
        const res = await this.githubApiService.updateFile(
            user,
            gamificationLayer.project_id,
            path,
            rule.sha,
            Buffer.from(JSON.stringify({
                id: rule.id,
                name: rule.name,
                triggers: rule.triggers,
                criteria: rule.criteria,
                actions: rule.actions
            })).toString('base64')
        );
        await this.repository.update(rule.id, { sha: res.content.sha });
        this.logger.debug('[onRuleUpdate] Rule updated in Github repository');
    }

    @Process(RULE_SYNC_DELETE)
    public async onRuleDelete(job: Job) {
        this.logger.debug(`[onRuleDelete] Delete rule in Github repository`);
        const { user, rule } = job.data;
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
    }
}

