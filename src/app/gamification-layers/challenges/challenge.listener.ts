import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppLogger } from '../../app.logger';
import { GithubApiService } from '../../github-api/github-api.service';
import { UserEntity } from '../../user/entity/user.entity';
import { GamificationLayerService } from '../gamification-layer.service';

import { CHALLENGE_CMD_CREATE, CHALLENGE_CMD_UPDATE, CHALLENGE_CMD_DELETE } from './challenge.constants';
import { ChallengeEntity } from './entity/challenge.entity';

@Controller()
export class ChallengeListener {

    private logger = new AppLogger(ChallengeListener.name);

    constructor(
        @InjectRepository(ChallengeEntity)
        protected readonly repository: Repository<ChallengeEntity>,
        protected readonly gamificationLayerService: GamificationLayerService,
        protected readonly githubApiService: GithubApiService
    ) { }

    @MessagePattern({ cmd: CHALLENGE_CMD_CREATE })
    public async onChallengeCreate(
        { user, challenge }: { user: UserEntity, challenge: ChallengeEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onChallengeCreate] Create challenge in Github repository`);
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
        } catch (err) {
            this.logger.error(`[onChallengeCreate] Challenge NOT created in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: CHALLENGE_CMD_UPDATE })
    public async onChallengeUpdate(
        { user, challenge }: { user: UserEntity, challenge: ChallengeEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onChallengeUpdate] Update challenge in Github repository`);
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
                    children: challenge.sub_challenge_ids
                })).toString('base64')
            );
            await this.repository.update(challenge.id, { sha: res.content.sha });
            this.logger.debug('[onChallengeUpdate] Challenge updated in Github repository');
        } catch (err) {
            this.logger.error(`[onChallengeUpdate] Challenge NOT updated in Github repository, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: CHALLENGE_CMD_DELETE })
    public async onChallengeDelete(
        { user, challenge }: { user: UserEntity, challenge: ChallengeEntity }
    ): Promise<void> {
        try {
            this.logger.debug(`[onChallengeDelete] Delete challenge in Github repository`);
            const gamificationLayer = await this.gamificationLayerService.findOne(challenge.gl_id);
            await this.githubApiService.deleteFolder(
                user,
                gamificationLayer.project_id,
                `gamification-layers/${challenge.gl_id}/challenges/${challenge.id}`
            );
            this.logger.debug('[onChallengeDelete] Challenge deleted in Github repository');
        } catch (err) {
            this.logger.error(`[onChallengeDelete] Challenge NOT deleted in Github repository, because ${err.message}`, err.stack);
        }
    }
}

