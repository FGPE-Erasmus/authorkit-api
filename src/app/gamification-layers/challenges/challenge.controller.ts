import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor, Req, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CrudController, Crud, Override, ParsedRequest, CrudRequest, ParsedBody } from '@nestjsx/crud';

import { AppLogger } from '../../app.logger';
import { User } from '../../_helpers/decorators/user.decorator';
import { AccessLevel } from '../../permissions/entity/access-level.enum';
import { GamificationLayerService } from '../gamification-layer.service';

import { ChallengeService } from './challenge.service';
import { ChallengeEntity } from './entity/challenge.entity';
import { ChallengeEmitter } from './challenge.emitter';

@Controller('challenges')
@ApiUseTags('challenges')
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
        }
    }
})
export class ChallengeController implements CrudController<ChallengeEntity> {

    private logger = new AppLogger(ChallengeController.name);

    constructor(
        readonly service: ChallengeService,
        readonly emitter: ChallengeEmitter,
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
        this.emitter.sendCreate(user, challenge);
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
        this.emitter.sendUpdate(user, challenge);
        return challenge;
    }

    /* @Override()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    async replaceOne(
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
        const challenge = await this.base.replaceOneBase(parsedReq, dto);
        this.emitter.sendUpdate(challenge);
        return challenge;
    } */

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
            this.emitter.sendDelete(user, challenge);
        }
        return challenge;
    }
}
