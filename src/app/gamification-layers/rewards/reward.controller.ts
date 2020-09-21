import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CrudController, Crud, Override, ParsedRequest, CrudRequest, ParsedBody } from '@nestjsx/crud';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { AppLogger } from '../../app.logger';
import { User } from '../../_helpers/decorators/user.decorator';
import { AccessLevel } from '../../permissions/entity/access-level.enum';
import { GamificationLayerService } from '../gamification-layer.service';
import { ChallengeService } from '../challenges/challenge.service';

import {
    REWARD_SYNC_QUEUE,
    REWARD_SYNC_CREATE,
    REWARD_SYNC_UPDATE,
    REWARD_SYNC_DELETE
} from './reward.constants';
import { RewardService } from './reward.service';
import { RewardEntity } from './entity/reward.entity';

@Controller('rewards')
@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: RewardEntity
    },
    routes: {
        getManyBase: {
            interceptors: [],
            decorators: []
        },
        getOneBase: {
            interceptors: [],
            decorators: []
        },
        createOneBase: {
            interceptors: [],
            decorators: []
        },
        updateOneBase: {
            interceptors: [],
            decorators: []
        },
        deleteOneBase: {
            interceptors: [],
            decorators: [],
            returnDeleted: true
        }
    },
    query: {
        join: {
            gl_id: {
            },
            challenge_id: {
            },
            exercise: {
            },
            challenges: {
            }
        }
    }
})
export class RewardController implements CrudController<RewardEntity> {

    private logger = new AppLogger(RewardController.name);

    constructor(
        readonly service: RewardService,
        @InjectQueue(REWARD_SYNC_QUEUE) private readonly rewardSyncQueue: Queue,
        readonly glservice: GamificationLayerService,
        readonly challengeservice: ChallengeService
    ) { }

    get base(): CrudController<RewardEntity> {
        return this;
    }

    @Override()
    async getOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        return this.base.getOneBase(parsedReq);
    }

    @Override()
    async getMany(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const glFilterIndex = parsedReq.parsed.filter
            .findIndex(f => f.field === 'gl_id' && f.operator === 'eq');
        const challengeFilterIndex = parsedReq.parsed.filter
            .findIndex(f => f.field === 'challenge_id' && f.operator === 'eq');
        let accessLevel: AccessLevel;
        if (glFilterIndex < 0 && challengeFilterIndex < 0) {
            throw new BadRequestException('Rewards must be listed per gamification layer or challenge');
        } else if (glFilterIndex >= 0) {
            accessLevel = await this.glservice.getAccessLevel(
                parsedReq.parsed.filter[glFilterIndex].value, user.id);
        } else {
            accessLevel = await this.challengeservice.getAccessLevel(
                parsedReq.parsed.filter[challengeFilterIndex].value, user.id);
        }
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.base.getManyBase(parsedReq);
    }

    @Override()
    async createOne(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: RewardEntity
    ) {
        const accessLevel = await this.glservice.getAccessLevel(
            dto.gl_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const reward = await this.base.createOneBase(parsedReq, dto);
        this.rewardSyncQueue.add(REWARD_SYNC_CREATE, { user, reward });
        return reward;
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: RewardEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const reward = await this.base.updateOneBase(parsedReq, dto);
        this.rewardSyncQueue.add(REWARD_SYNC_UPDATE, { user, reward });
        return reward;
    }

    @Override()
    async deleteOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        const reward = await this.base.deleteOneBase(parsedReq);
        if (reward instanceof RewardEntity) {
            this.rewardSyncQueue.add(REWARD_SYNC_DELETE, { user, reward });
        }
        return reward;
    }
}
