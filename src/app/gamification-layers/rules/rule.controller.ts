import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor, Req, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CrudController, Crud, Override, ParsedRequest, CrudRequest, ParsedBody } from '@nestjsx/crud';

import { AppLogger } from '../../app.logger';
import { User } from '../../_helpers/decorators/user.decorator';
import { AccessLevel } from '../../permissions/entity/access-level.enum';
import { GamificationLayerService } from '../gamification-layer.service';
import { ChallengeService } from '../challenges/challenge.service';

import { RuleService } from './rule.service';
import { RuleEntity } from './entity/rule.entity';
import { RuleEmitter } from './rule.emitter';

@Controller('rules')
@ApiUseTags('rules')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: RuleEntity
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
    }
})
export class RuleController implements CrudController<RuleEntity> {

    private logger = new AppLogger(RuleController.name);

    constructor(
        readonly service: RuleService,
        readonly emitter: RuleEmitter,
        readonly glservice: GamificationLayerService,
        readonly challengeservice: ChallengeService
    ) { }

    get base(): CrudController<RuleEntity> {
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
            throw new BadRequestException('Rules must be listed per gamification layer or challenge');
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
        @ParsedBody() dto: RuleEntity
    ) {
        let accessLevel: AccessLevel;
        if (dto.gl_id) {
            accessLevel = await this.glservice.getAccessLevel(
                dto.gl_id, user.id);
        } else {
            accessLevel = await this.challengeservice.getAccessLevel(
                dto.gl_id, user.id);
        }
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const rule = await this.base.createOneBase(parsedReq, dto);
        this.emitter.sendCreate(user, rule);
        return rule;
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: RuleEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const rule = await this.base.updateOneBase(parsedReq, dto);
        this.emitter.sendUpdate(user, rule);
        return rule;
    }

    /* @Override()
    async replaceOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: RuleEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(
            req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const rule = await this.base.replaceOneBase(parsedReq, dto);
        this.emitter.sendUpdate(rule);
        return rule;
    } */

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
        const rule = await this.base.deleteOneBase(parsedReq);
        if (rule) {
            this.emitter.sendDelete(user, rule);
        }
        return rule;
    }
}
