import {
    UseInterceptors,
    Controller,
    ClassSerializerInterceptor,
    UseGuards,
    Req,
    ForbiddenException,
    BadRequestException,
    Get,
    HttpCode,
    HttpStatus,
    Header,
    Res,
    InternalServerErrorException
} from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrudController, Override, ParsedBody, ParsedRequest, CrudRequest, Crud } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { User } from '../_helpers/decorators/user.decorator';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { ProjectService } from '../project/project.service';
import { GamificationLayerEntity } from './entity/gamification-layer.entity';
import { GamificationLayerService } from './gamification-layer.service';
import {
    GAMIFICATION_LAYER_SYNC_QUEUE,
    GAMIFICATION_LAYER_SYNC_CREATE,
    GAMIFICATION_LAYER_SYNC_UPDATE,
    GAMIFICATION_LAYER_SYNC_DELETE
} from './gamification-layer.constants';

@Controller('gamification-layers')
@ApiUseTags('gamification-layers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: GamificationLayerEntity
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
            'challenges': {
            },
            'leaderboards': {
            },
            'rewards': {
            },
            'rules': {
            }
        }
    }
})
export class GamificationLayerController implements CrudController<GamificationLayerEntity> {

    constructor(
        readonly service: GamificationLayerService,
        @InjectQueue(GAMIFICATION_LAYER_SYNC_QUEUE) private readonly gamificationLayerSyncQueue: Queue,
        readonly projectService: ProjectService
    ) { }

    get base(): CrudController<GamificationLayerEntity> {
        return this;
    }

    @Get(':id/export')
    @HttpCode(HttpStatus.OK)
    @Header('Content-Type', 'application/octet-stream')
    async export(
        @User() user: any,
        @Req() req,
        @Res() res
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        res.set(
            'Content-Disposition',
            `attachment; filename=${req.params.id}.${req.query.format || 'zip'}`
        );
        try {
            await this.service.export(user, req.params.id, req.query.format || 'zip', res);
            res.end();
        } catch (err) {
            throw new InternalServerErrorException('Archive creation failed');
        }
    }

    @Override()
    async getOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
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
        const projectFilterIndex = parsedReq.parsed.filter
            .findIndex(f => f.field === 'project_id' && f.operator === 'eq');
        if (projectFilterIndex < 0) {
            throw new BadRequestException('Gamification layers must be listed per project');
        }
        const accessLevel = await this.projectService.getAccessLevel(
            parsedReq.parsed.filter[projectFilterIndex].value, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.base.getManyBase(parsedReq);
    }

    @Override()
    async createOne(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: GamificationLayerEntity
    ) {
        const accessLevel = await this.projectService.getAccessLevel(dto.project_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        if (!dto.owner_id) {
            dto.owner_id = user.id;
        }
        const gamificationLayer = await this.base.createOneBase(parsedReq, dto);
        this.gamificationLayerSyncQueue.add(
            GAMIFICATION_LAYER_SYNC_CREATE,
            { user, gamificationLayer }
        );
        return gamificationLayer;
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: GamificationLayerEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const gamificationLayer = await this.base.updateOneBase(parsedReq, dto);
        this.gamificationLayerSyncQueue.add(
            GAMIFICATION_LAYER_SYNC_UPDATE,
            { user, gamificationLayer }
        );
        return gamificationLayer;
    }

    @Override()
    async deleteOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        const gamificationLayer = await this.base.deleteOneBase(parsedReq);
        if (gamificationLayer) {
            this.gamificationLayerSyncQueue.add(
                GAMIFICATION_LAYER_SYNC_DELETE,
                { user, gamificationLayer }
            );
        }
        return gamificationLayer;
    }
}
