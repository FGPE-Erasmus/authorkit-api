import {
    Controller,
    UseGuards,
    UseInterceptors,
    ClassSerializerInterceptor,
    Req, ForbiddenException,
    BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CrudController, Crud, Override, ParsedRequest, CrudRequest, ParsedBody } from '@nestjsx/crud';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { AppLogger } from '../../app.logger';
import { User } from '../../_helpers/decorators/user.decorator';
import { AccessLevel } from '../../permissions/entity/access-level.enum';
import { GamificationLayerService } from '../gamification-layer.service';

import {
    CHALLENGE_SYNC_QUEUE,
    CHALLENGE_SYNC_CREATE,
    CHALLENGE_SYNC_UPDATE,
    CHALLENGE_SYNC_DELETE
} from './challenge.constants';
import { ChallengeService } from './challenge.service';
import { ChallengeEntity } from './entity/challenge.entity';

@Controller('challenges')
@ApiTags('challenges')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: ChallengeEntity
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
            },
            'rewards': {
            },
            'rules': {
            }
        },
        sort: [
            {
                field: 'name',
                order: 'ASC',
            }
        ]
    }
})
export class ChallengeController implements CrudController<ChallengeEntity> {

    private logger = new AppLogger(ChallengeController.name);

    constructor(
        readonly service: ChallengeService,
        @InjectQueue(CHALLENGE_SYNC_QUEUE) private readonly challengeSyncQueue: Queue,
        readonly glservice: GamificationLayerService
    ) { }

    get base(): CrudController<ChallengeEntity> {
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
        if (glFilterIndex < 0) {
            throw new BadRequestException('Challenges must be listed per gamification layer');
        }
        const accessLevel = await this.glservice.getAccessLevel(
            parsedReq.parsed.filter[glFilterIndex].value, user.id);
        this.logger.debug(`Access level found is ${accessLevel}`);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.base.getManyBase(parsedReq);
    }

    @Override()
    async createOne(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ChallengeEntity
    ) {
        const accessLevel = await this.glservice.getAccessLevel(
            dto.gl_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const challenge = await this.base.createOneBase(parsedReq, dto);
        this.challengeSyncQueue.add(CHALLENGE_SYNC_CREATE, { user, challenge });
        if (challenge.parent_challenge_id) { // update parent on Github
            this.challengeSyncQueue.add(CHALLENGE_SYNC_UPDATE, {
                user,
                challenge: await this.service.findOne(challenge.parent_challenge_id)
            });
        }
        return challenge;
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ChallengeEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const challenge = await this.base.updateOneBase(parsedReq, dto);
        this.challengeSyncQueue.add(CHALLENGE_SYNC_UPDATE, { user, challenge });
        return challenge;
    }

    @Override()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
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
        const challenge = await this.base.deleteOneBase(parsedReq);
        if (challenge) {
            this.challengeSyncQueue.add(CHALLENGE_SYNC_DELETE, { user, challenge });
        }
        return challenge;
    }
}
