import {
    Controller,
    UseGuards,
    UseInterceptors,
    ClassSerializerInterceptor,
    Req,
    Body,
    ForbiddenException,
    Post,
    NotFoundException,
    Get
} from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CrudController, Crud, Override, ParsedRequest, CrudRequest } from '@nestjsx/crud';

import { AppLogger } from '../app.logger';
import { User } from '../_helpers/decorators/user.decorator';
import { UserService } from '../user/user.service';

import { PermissionEntity, AccessLevel } from './entity';
import { PermissionService } from './permission.service';
import { ShareDto } from './dto/share.dto';
import { ShareByEmailDto } from './dto/share-by-email.dto';
import { RevokeDto } from './dto/revoke.dto';

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
        readonly service: PermissionService,
        readonly userService: UserService
    ) {}

    get base(): CrudController<PermissionEntity> {
        return this;
    }

    @Get(':project_id')
    async getPermissionOfUserInProject(
        @User() user: any,
        @Req() req
    ) {
        return this.service.findPermissionOf(user.id, req.params.project_id);
    }

    @Get()
    async getPermissionsOfUser(
        @User() user: any,
        @Req() req
    ) {
        return this.service.findAllPermissionsOf(user.id);
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

    @Post('share-by-email')
    async shareByEmail(
        @User() user: any,
        @Req() req,
        @Body() share: ShareByEmailDto
    ) {
        const accessLevel = await this.service.getAccessLevel(share.project_id, user.id);
        if (accessLevel < AccessLevel.ADMIN) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        if (accessLevel < share.access_level) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        const shareUser = await this.userService.findByEmail(share.email);
        if (!shareUser) {
            throw new NotFoundException();
        }
        const otherAccessLevel = await this.service.getAccessLevel(share.project_id, shareUser.id);
        if (otherAccessLevel === AccessLevel.OWNER) {
            throw new ForbiddenException('You shall not modify owner\'s access to the project');
        }
        await this.service.share(share.project_id, shareUser.id, share.access_level);
    }

    @Post('revoke')
    async revoke(
        @User() user: any,
        @Req() req,
        @Body() dto: RevokeDto
    ) {
        const accessLevel = await this.service.getAccessLevel(dto.project_id, user.id);
        if (accessLevel < AccessLevel.ADMIN) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        const otherAccessLevel = await this.service.getAccessLevel(dto.project_id, dto.user_id);
        if (otherAccessLevel === AccessLevel.OWNER) {
            throw new ForbiddenException('You shall not modify owner\'s access to the project');
        }
        await this.service.revoke(dto.project_id, dto.user_id);
    }
}
