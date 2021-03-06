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
    LEADERBOARD_SYNC_QUEUE,
    LEADERBOARD_SYNC_CREATE,
    LEADERBOARD_SYNC_UPDATE,
    LEADERBOARD_SYNC_DELETE
} from './leaderboard.constants';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardEntity } from './entity/leaderboard.entity';

@Controller('leaderboards')
@ApiTags('leaderboards')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: LeaderboardEntity
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
            'leaderboards': {
                eager: true
            },
            'rewards': {
                eager: true
            },
            'rules': {
                eager: true
            }
        }
    }
})
export class LeaderboardController implements CrudController<LeaderboardEntity> {

    private logger = new AppLogger(LeaderboardController.name);

    constructor(
        readonly service: LeaderboardService,
        @InjectQueue(LEADERBOARD_SYNC_QUEUE) private readonly leaderboardSyncQueue: Queue,
        readonly glservice: GamificationLayerService,
        readonly challengeservice: ChallengeService
    ) { }

    get base(): CrudController<LeaderboardEntity> {
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
            throw new BadRequestException('Leaderboards must be listed per gamification layer or challenge');
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
        @ParsedBody() dto: LeaderboardEntity
    ) {
        const accessLevel = await this.glservice.getAccessLevel(
            dto.gl_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const leaderboard = await this.base.createOneBase(parsedReq, dto);
        this.leaderboardSyncQueue.add(LEADERBOARD_SYNC_CREATE, { user, leaderboard });
        return leaderboard;
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: LeaderboardEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const leaderboard = await this.base.updateOneBase(parsedReq, dto);
        this.leaderboardSyncQueue.add(LEADERBOARD_SYNC_UPDATE, { user, leaderboard });
        return leaderboard;
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
        const leaderboard = await this.base.deleteOneBase(parsedReq);
        if (leaderboard instanceof LeaderboardEntity) {
            this.leaderboardSyncQueue.add(LEADERBOARD_SYNC_DELETE, { user, leaderboard });
        }
        return leaderboard;
    }
}
