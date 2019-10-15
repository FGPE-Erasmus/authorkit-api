import {
    Body,
    Controller,
    HttpCode,
    Post,
    UseGuards,
    Put,
    Patch,
    Param,
    UseInterceptors,
    ClassSerializerInterceptor,
    Get,
    Delete,
    Req
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiImplicitBody, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { config } from '../../config';
import { mail } from '../_helpers/mail';
import { AppLogger } from '../app.logger';
import { createToken } from '../auth/jwt';
import { UserEntityDto } from '../auth/dto/user-entity.dto';
import { UserEntity } from './entity';
import { UserCommand } from './user.command';
import { USER_CMD_PASSWORD_NEW, USER_CMD_PASSWORD_RESET, USER_CMD_REGISTER, USER_CMD_REGISTER_VERIFY } from './user.constants';
import { UserService } from './user.service';
import { DeepPartial } from 'typeorm';
import { RestController } from '../../base';

@Controller('user')
@ApiUseTags('user')
export class UserController extends RestController<UserEntity> {
    private logger = new AppLogger(UserController.name);

    constructor(
        protected service: UserService,
        private userCmd: UserCommand
    ) {
        super();
    }

    @Post('import')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    public async importUsers(): Promise<any> {
        return this.userCmd.create(20);
    }

    @Get('/')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(200)
    @ApiResponse({ status: 200, description: 'OK', type: [UserEntityDto] })
    public findAll(@Req() req): Promise<UserEntity[]> {
        return super.findAll(req);
    }

    @Get('/:id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(200)
    @ApiResponse({ status: 200, description: 'OK', type: UserEntityDto })
    public async findOne(@Param('id') id: string) {
        return super.findOne(id);
    }

    @Post('/')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(201)
    @ApiImplicitBody({ required: true, type: UserEntityDto, name: 'UserEntityDto' })
    @ApiResponse({ status: 200, description: 'OK', type: UserEntityDto })
    public async create(@Body() data: DeepPartial<UserEntity>): Promise<UserEntity> {
        return super.create(data);
    }

    @Put('/:id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(200)
    @ApiImplicitBody({ required: true, type: UserEntityDto, name: 'UserEntityDto' })
    @ApiResponse({ status: 200, description: 'OK', type: UserEntityDto })
    public async update(@Param('id') id: string, @Body() data: DeepPartial<UserEntity>): Promise<UserEntity> {
        return super.update(id, data);
    }

    @Patch('/:id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(200)
    @ApiImplicitBody({ required: true, type: UserEntityDto, name: 'UserEntityDto' })
    @ApiResponse({ status: 200, description: 'OK', type: UserEntityDto })
    public async patch(@Param('id') id: string, @Body() data: DeepPartial<UserEntity>): Promise<UserEntity> {
        return super.patch(id, data);
    }

    @Delete('/:id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    public async delete(@Param('id') id: string): Promise<UserEntity> {
        return super.delete(id);
    }

    @MessagePattern({ cmd: USER_CMD_REGISTER })
    public async onUserRegister(user: UserEntity): Promise<void> {
        try {
            this.logger.debug(`[onUserRegister] Send verification email for user ${user.email}`);
            const token = createToken(user.id.toString(), config.auth.verify.timeout, config.auth.verify.secret);
            await mail(
                'email-verification',
                user.email,
                {
                    app_name: config.name,
                    app_host: config.host,
                    app_port: config.port,
                    firstname: user.first_name,
                    lastname: user.last_name,
                    token
                }
            );
            this.logger.debug('[onUserRegister] Verification email sent');
        } catch (err) {
            this.logger.error(`[onUserRegister] Verification email not sent, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: USER_CMD_REGISTER_VERIFY })
    public async onUserRegisterVerify(user: UserEntity): Promise<void> {
        try {
            this.logger.debug(`[onUserRegisterVerify] Send welcome email for user ${user.email}`);
            await mail(
                'welcome',
                user.email,
                {
                    app_name: config.name,
                    app_host: config.host,
                    app_port: config.port,
                    firstname: user.first_name,
                    lastname: user.last_name
                }
            );
            this.logger.debug('[onUserRegisterVerify] Welcome email sent');
        } catch (err) {
            this.logger.error(`[onUserRegisterVerify] Mail not sent, because ${err.message}`, err.stack);
        }
    }

    @MessagePattern({ cmd: USER_CMD_PASSWORD_RESET })
    public async onUserPasswordReset(user: UserEntity): Promise<void> {
        try {
            this.logger.debug(`[onUserRegister] Send password reset instruction email for user ${user.email}`);
            const token = createToken(user.id.toString(), config.auth.password_reset.timeout, config.auth.password_reset.secret);
            await mail(
                'reset-password',
                user.email,
                {
                    app_name: config.name,
                    app_host: config.host,
                    app_port: config.port,
                    firstname: user.first_name,
                    lastname: user.last_name,
                    token
                }
            );
            this.logger.debug('[onUserRegister] Password reset email sent');
        } catch (err) {
            this.logger.error(`[onUserRegister] Mail not sent, because ${JSON.stringify(err.message)}`, err.stack);
        }
    }

    @MessagePattern({ cmd: USER_CMD_PASSWORD_NEW })
    public async onUserPasswordNew(user: UserEntity): Promise<void> {
        try {
            this.logger.debug(`[onUserRegister] Send password new email for user ${user.email}`);
            await mail(
                'new-password',
                user.email,
                {
                    app_name: config.name,
                    app_host: config.host,
                    app_port: config.port,
                    firstname: user.first_name,
                    lastname: user.last_name
                }
            );
            this.logger.debug('[onUserRegister] Password new email sent');
        } catch (err) {
            this.logger.error(`[onUserRegister] Mail not sent, because ${err.message}`, err.stack);
        }
    }
}
