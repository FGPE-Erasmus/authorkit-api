import { BadRequestException, Body, Controller, ForbiddenException, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../_helpers/decorators';
import { CrudRequest, ParsedRequest } from '@nestjsx/crud';
import { TemplateDto } from './dto/import.dto';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { ProjectService } from '../project/project.service';
import { GamificationLayerService } from '../gamification-layers/gamification-layer.service';
import { InjectQueue } from '@nestjs/bull';
import { GAMIFICATION_LAYER_SYNC_CREATE, GAMIFICATION_LAYER_SYNC_QUEUE } from '../gamification-layers/gamification-layer.constants';
import { Queue } from 'bull';
import { DeepPartial } from '../_helpers';
import { GamificationLayerEntity } from '../gamification-layers/entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';


@ApiTags('gamification-template')
@Controller('gamification-template')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class GamificationTemplateController {

    constructor(
        @InjectQueue(GAMIFICATION_LAYER_SYNC_QUEUE) private readonly gamificationLayerSyncQueue: Queue,
        @InjectRepository(GamificationLayerEntity)
        protected readonly repository: Repository<GamificationLayerEntity>,
        readonly projectService: ProjectService
    ) { }

    @Get('/templates-list')
    async getAllTemplates() {
        return [{ 'id': '4exercises' }, { 'id': '2exercises' }];
    }

    @Post('/create-from-template')
    @ApiBody({ type: TemplateDto, required: true })
    async createTemplate(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @Body() dto: TemplateDto
    ) {
        // const url = 'https://raw.githubusercontent.com/uniparthenope-fgpe/gamification-template/main/' + dto.template_id + '.json';
        // const response = await fetch(url);
        // const data = await response.json();
        // console.log(this.projectService);

        if (!dto || !dto.project_id) {
            throw new BadRequestException('The id of the project must be specified');
        }
        if (!dto || !dto.template_id) {
            throw new BadRequestException('The id of the template must be specified');
        }
        const accessLevel = await this.projectService.getAccessLevel(dto.project_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }

        const project_id = dto.project_id;

        const gamification_layer: DeepPartial<GamificationLayerEntity> = {
            name: 'Test',
            description: 'Test',
            owner_id: user.id,
            status: 'Draft',
            project_id
        };

        // return await this.repository.save(gamification_layer);
        // return await this.gamificationLayerSyncQueue.add(
        //    GAMIFICATION_LAYER_SYNC_CREATE,
        //    { user, gamification_layer }
        // );
        return 'TEST';
    }
}

