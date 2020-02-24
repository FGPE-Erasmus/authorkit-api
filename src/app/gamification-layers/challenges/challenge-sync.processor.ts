import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AppLogger } from '../../app.logger';
import { GithubApiService } from '../../github-api/github-api.service';
import { GamificationLayerService } from '../gamification-layer.service';

import {
    CHALLENGE_SYNC_CREATE,
    CHALLENGE_SYNC_UPDATE,
    CHALLENGE_SYNC_DELETE,
    CHALLENGE_SYNC_QUEUE
} from './challenge.constants';
import { ChallengeEntity } from './entity/challenge.entity';

@Processor(CHALLENGE_SYNC_QUEUE)
export class ChallengeSyncProcessor {

    private logger = new AppLogger(ChallengeSyncProcessor.name);

    constructor(
        @InjectRepository(ChallengeEntity)
        protected readonly repository: Repository<ChallengeEntity>,
        protected readonly gamificationLayerService: GamificationLayerService,
        protected readonly githubApiService: GithubApiService
    ) { }

    @Process(CHALLENGE_SYNC_CREATE)
    public async onChallengeCreate(job: Job) {
        this.logger.debug(`[onChallengeCreate] Create challenge in Github repository`);
        const { user, challenge } = job.data;
        const gamificationLayer = await this.gamificationLayerService.findOne(challenge.gl_id);
        const res = await this.githubApiService.createFile(
            user,
            gamificationLayer.project_id,
            `gamification-layers/${challenge.gl_id}/challenges/${challenge.id}/metadata.json`,
            Buffer.from(JSON.stringify({
                id: challenge.id,
                name: challenge.name,
                description: challenge.description,
                refs: challenge.exercise_ids,
                mode: challenge.mode,
                mode_parameters: challenge.mode_parameters,
                locked: challenge.locked,
                hidden: challenge.hidden,
                difficulty: challenge.difficulty,
                children: challenge.sub_challenge_ids
            })).toString('base64')
        );
        await this.repository.update(challenge.id, { sha: res.content.sha });
        this.logger.debug('[onChallengeCreate] Challenge created in Github repository');
    }

    @Process(CHALLENGE_SYNC_UPDATE)
    public async onChallengeUpdate(job: Job) {
        this.logger.debug(`[onChallengeUpdate] Update challenge in Github repository`);
        const { user, challenge } = job.data;
        const gamificationLayer = await this.gamificationLayerService.findOne(challenge.gl_id);
        const res = await this.githubApiService.updateFile(
            user,
            gamificationLayer.project_id,
            `gamification-layers/${challenge.gl_id}/challenges/${challenge.id}/metadata.json`,
            challenge.sha,
            Buffer.from(JSON.stringify({
                id: challenge.id,
                name: challenge.name,
                description: challenge.description,
                refs: challenge.exercise_ids,
                mode: challenge.mode,
                mode_parameters: challenge.mode_parameters,
                locked: challenge.locked,
                hidden: challenge.hidden,
                difficulty: challenge.difficulty,
                children: challenge.sub_challenge_ids || []
            })).toString('base64')
        );
        await this.repository.update(challenge.id, { sha: res.content.sha });
        this.logger.debug('[onChallengeUpdate] Challenge updated in Github repository');
    }

    @Process(CHALLENGE_SYNC_DELETE)
    public async onChallengeDelete(job: Job) {
        this.logger.debug(`[onChallengeDelete] Delete challenge in Github repository`);
        const { user, challenge } = job.data;
        const gamificationLayer = await this.gamificationLayerService.findOne(challenge.gl_id);
        await this.githubApiService.deleteFolder(
            user,
            gamificationLayer.project_id,
            `gamification-layers/${challenge.gl_id}/challenges/${challenge.id}`
        );
        this.logger.debug('[onChallengeDelete] Challenge deleted in Github repository');
    }
}

