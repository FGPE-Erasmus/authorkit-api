import {
    Controller,
    UseGuards,
    UseInterceptors,
    ClassSerializerInterceptor,
    Req,
    Body,
    ForbiddenException,
    Post
} from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CrudController, Crud, Override, ParsedRequest, CrudRequest } from '@nestjsx/crud';

import { AppLogger } from '../app.logger';
import { User } from '../_helpers/decorators/user.decorator';

import { PermissionEntity, AccessLevel } from './entity';
import { PermissionService } from './permission.service';
import { ShareDto } from './dto/share.dto';

@Controller('permissions')
@ApiUseTags('permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: PermissionEntity
    },
    routes: {
        getManyBase: {
            interceptors: [],
            decorators: []
        },
        getOneBase: {
            interceptors: [],
            decorators: []
        }
    },
    query: {
        join: {
            projects: {
            },
            users: {
            }
        }
    }
})
export class PermissionController implements CrudController<PermissionEntity> {

    private logger = new AppLogger(PermissionController.name);

    constructor(
        readonly service: PermissionService
    ) {}

    get base(): CrudController<PermissionEntity> {
        return this;
    }

    @Override()
    async getMany(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const projectFilterIndex = parsedReq.parsed.filter
            .findIndex(f => f.field === 'project_id' && f.operator === 'eq');
        const userFilterIndex = parsedReq.parsed.filter
            .findIndex(f => f.field === 'user_id' && f.operator === 'eq');
        if (projectFilterIndex < 0) {
            if (userFilterIndex < 0) {
                parsedReq.parsed.filter.push({ field: 'user_id', operator: 'eq', value: user.id });
                return this.base.getManyBase(parsedReq);
            } else if (parsedReq.parsed.filter[userFilterIndex].value === user.id) {
                return this.base.getManyBase(parsedReq);
            } else {
                throw new ForbiddenException('You do not have sufficient privileges');
            }
        }
        if (userFilterIndex > 0 && parsedReq.parsed.filter[userFilterIndex].value === user.id) {
            return this.base.getManyBase(parsedReq);
        }
        const accessLevel = await this.service.getAccessLevel(
            parsedReq.parsed.filter[projectFilterIndex].value,
            user.id
        );
        if (accessLevel < AccessLevel.ADMIN) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        return this.base.getManyBase(parsedReq);
    }

    @Override()
    async getOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const permission = await this.base.getOneBase(parsedReq);
        if (user.id === permission.user_id) {
            return permission;
        }
        const accessLevel = await this.service.getAccessLevel(
            permission.project_id,
            user.id
        );
        if (accessLevel < AccessLevel.ADMIN) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        return permission;
    }

    @Post('share')
    async share(
        @User() user: any,
        @Req() req,
        @Body() share: ShareDto
    ) {
        const accessLevel = await this.service.getAccessLevel(share.project_id, user.id);
        if (accessLevel < AccessLevel.ADMIN) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        if (accessLevel < share.access_level) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        const otherAccessLevel = await this.service.getAccessLevel(share.project_id, share.user_id);
        if (otherAccessLevel === AccessLevel.OWNER) {
            throw new ForbiddenException('You shall not modify owner\'s access to the project');
        }
        await this.service.share(share.project_id, share.user_id, share.access_level);
    }

    @Post('revoke')
    async revoke(
        @User() user: any,
        @Req() req,
        @Body() share: ShareDto
    ) {
        const accessLevel = await this.service.getAccessLevel(share.project_id, user.id);
        if (accessLevel < AccessLevel.ADMIN) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        const otherAccessLevel = await this.service.getAccessLevel(share.project_id, share.user_id);
        if (otherAccessLevel === AccessLevel.OWNER) {
            throw new ForbiddenException('You shall not modify owner\'s access to the project');
        }
        await this.service.revoke(share.project_id, share.user_id);
    }
}
