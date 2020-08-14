import {
    Controller,
    Post,
    UseGuards,
    ClassSerializerInterceptor,
    UseInterceptors,
    Get,
    Req,
    ForbiddenException,
    Body
} from '@nestjs/common';
import { CrudController, Crud, Override, ParsedRequest, CrudRequest, GetManyDefaultResponse, ParsedBody } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { User } from '../_helpers/decorators/user.decorator';
import { UserRole } from '../access-control';
import { UserEntity } from './entity';
import { UserService } from './user.service';
import { UserUpdateDto } from './dto/user-update.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: UserEntity
    },
    dto: {
        update: UserUpdateDto
    },
    validation: config.validator.options,
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
export class UserController implements CrudController<UserEntity> {

    private logger = new AppLogger(UserController.name);

    constructor(
        readonly service: UserService
    ) { }

    get base(): CrudController<UserEntity> {
        return this;
    }

    @Get('me')
    public async me(@Req() req) {
        return req.user;
    }

    @Post('change-password')
    async changePassword(
        @User() user: any,
        @Body() dto: ChangePasswordDto
    ) {
        return this.service.updatePasswordWithOld({
            id: user.id,
            password: dto.new_password
        }, dto.old_password);
    }

    @Override()
    async getOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        if (!user.roles.includes(UserRole.ADMIN) && user.id !== req.params.id) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        return this.base.getOneBase(parsedReq);
    }

    @Override()
    async getMany(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest
    ): Promise<GetManyDefaultResponse<UserEntity> | UserEntity[]> {
        if (!user.roles.includes(UserRole.ADMIN)) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        return this.base.getManyBase(parsedReq);
    }

   @Override()
    async createOne(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: UserEntity
    ): Promise<UserEntity> {
        if (!user.roles.includes(UserRole.ADMIN)) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        return this.base.createOneBase(parsedReq, dto);
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: UserUpdateDto
    ) {
        if (!user.roles.includes(UserRole.ADMIN) && user.id !== req.params.id) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        if (!user.roles.includes(UserRole.ADMIN)) {
            delete dto.roles;
            delete dto.facebook_id;
            delete dto.github_id;
            delete dto.google_id;
            delete dto.twitter_id;
        }
        return this.base.updateOneBase(parsedReq, dto as UserEntity);
    }

    @Override()
    async deleteOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        if (!user.roles.includes(UserRole.ADMIN) && user.id !== req.params.id) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        return this.base.deleteOneBase(parsedReq);
    }
}
