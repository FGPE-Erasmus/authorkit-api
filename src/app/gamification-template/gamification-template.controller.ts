import {Body, Controller, ForbiddenException, Get, Param, Post, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiBody, ApiTags} from '@nestjs/swagger';
import {AuthGuard} from '@nestjs/passport';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import fetch from 'node-fetch';
import { GamificationTemplateEntity } from './entity/gamification-template.entity';
import {TestEntity} from '../tests/entity/test.entity';
import {AccessLevel} from '../permissions/entity';
import {User} from '../_helpers/decorators';
import {Crud, CrudController, CrudRequest, ParsedRequest} from '@nestjsx/crud';
import {GamificationLayerController} from '../gamification-layers/gamification-layer.controller';

import {
    GAMIFICATION_LAYER_SYNC_QUEUE,
    GAMIFICATION_LAYER_SYNC_CREATE,
    GAMIFICATION_LAYER_SYNC_UPDATE,
    GAMIFICATION_LAYER_SYNC_DELETE
} from '../gamification-layers/gamification-layer.constants';
import {ProjectService} from '../project/project.service';
import {GamificationLayerEntity} from '../gamification-layers/entity';
import {GamificationLayerService} from '../gamification-layers/gamification-layer.service';
import {InjectQueue} from '@nestjs/bull';
import {Queue} from 'bull';


@ApiTags('gamification-template')
@Controller('gamification-template')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class GamificationTemplateController {
    @Get('/templates-list')
    async getAllTemplates() {
        const list = [{'id': '4exercises'}, {'id': '2exercises'}];
        return list;
    }
    @Post('/create-from-template')
    @ApiBody({ type: GamificationTemplateEntity })
    async createTemplate(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @Body() dto: GamificationTemplateEntity
    ) {
        // const accessLevel = await this.exerciseService.getAccessLevel(dto.exercise_id, user.id);
        console.log(dto.template_id);
        const url = 'https://raw.githubusercontent.com/uniparthenope-fgpe/gamification-template/main/' + dto.template_id + '.json';
        const response = await fetch(url);
        const data = await response.json();
        // Create a new Gamification Layer
        /*
        const accessLevel = await this.projectService.getAccessLevel(dto.project_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        if (!dto.owner_id) {
            dto.owner_id = user.id;
        }
        const gamification_layer = await this.base.createOneBase(parsedReq, dto);
        this.gamificationLayerSyncQueue.add(
            GAMIFICATION_LAYER_SYNC_CREATE,
            { user, gamification_layer }
        );
        return gamification_layer;


         */
        console.log(dto.template_id);
        console.log(user);
        const created_template_id = 'TEST';
        return created_template_id;
    }
}

