import { Body, Controller, HttpCode, Post, UseGuards, Get, Query, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { config } from '../../config';
import { DeepPartial } from '../_helpers/database';
import { User } from '../_helpers/decorators';
import { AppLogger } from '../app.logger';
import {
    USER_EMAIL_QUEUE,
    USER_EMAIL_REGISTER,
    USER_EMAIL_REGISTER_VERIFY,
    USER_EMAIL_PASSWORD_RESET,
    USER_EMAIL_PASSWORD_NEW
} from '../user/user.constants';
import { UserEntity } from '../user/entity';
import { UserService } from '../user/user.service';

import { CredentialsDto } from './dto/credentials.dto';
import { JwtDto } from './dto/jwt.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserEntityDto } from './dto/user-entity.dto';
import { FacebookProfile } from './interfaces/facebook-profile.interface';
import { createAuthToken, verifyToken } from './jwt';
import { PasswordResetDto } from './dto/password-reset.dto';
import { PasswordTokenDto } from './dto/password-token.dto';
import { VerifyResendDto } from './dto/verify-resend.dto';
import { TokenDto } from './dto/token.dto';


@ApiTags('auth')
@Controller('auth')
export class AuthController {

    private logger = new AppLogger(AuthController.name);

    constructor(
        private readonly userService: UserService,
        @InjectQueue(USER_EMAIL_QUEUE) private readonly userEmailQueue: Queue,
        @InjectRepository(UserEntity) protected readonly repository: Repository<UserEntity>
    ) {
    }

    @Post('login')
    @HttpCode(200)
    @ApiResponse({ status: 200, description: 'OK', type: JwtDto })
    public async login(@Body() credentials: CredentialsDto): Promise<JwtDto> {
        const user = await this.userService.login(credentials);
        this.logger.debug(`[login] User ${credentials.email} logging`);
        return createAuthToken(user);
    }

    @Post('register')
    @HttpCode(204)
    @ApiBody({ required: true, type: UserEntityDto })
    @ApiResponse({ status: 204, description: 'NO_CONTENT' })
    public async register(@Body() data: DeepPartial<UserEntity>): Promise<void> {
        this.logger.debug(`[register] User ${data.email} register`);
        let user = await this.userService.findByEmail(data.email);
        if (user) {
            throw new ConflictException('User already exists.');
        }
        user = await this.userService.register(data);
        await this.userEmailQueue.add(USER_EMAIL_REGISTER, { user });
        this.logger.debug(`[register] Send registration email for email ${data.email}`);
    }

    @Get('register/verify')
    @HttpCode(200)
    @ApiResponse({ status: 200, description: 'OK', type: JwtDto })
    public async registerVerify(@Query('token') activationToken: string): Promise<JwtDto> {
        this.logger.debug(`[registerVerify] Token ${activationToken}`);
        let token: TokenDto;
        try {
            token = await verifyToken(activationToken, config.auth.verify.secret);
        } catch (err) {
            throw new BadRequestException(`Invalid token - ${err.message}`);
        }
        const user = await this.userService.findOne(token.id);
        if (!user) {
            throw new NotFoundException('Activation token does not belong to a valid user');
        }
        if (user.is_verified) {
            throw new BadRequestException(`User ${user.email} already verified`);
        }
        await this.repository.update(token.id, { is_verified: true });
        await this.userEmailQueue.add(USER_EMAIL_REGISTER_VERIFY, { user });
        this.logger.debug(`[registerVerify] Sent command register verify for user id ${user.id}`);
        return createAuthToken(user);
    }

    @Post('register/verify/resend')
    @HttpCode(204)
    @ApiBody({ required: true, type: VerifyResendDto })
    @ApiResponse({ status: 204, description: 'NO CONTENT' })
    public async registerVerifyResend(@Body() body: VerifyResendDto): Promise<void> {
        this.logger.debug(`[registerVerifyResend] Resend verification email to ${body.email}`);
        const user = await this.userService.findByEmail(body.email);
        if (!user) {
            throw new BadRequestException(`User with email "${body.email}" does not exist.`);
        }
        if (user.is_verified) {
            throw new BadRequestException(`User with email "${user.email}" already verified`);
        }
        await this.userEmailQueue.add(USER_EMAIL_REGISTER, { user });
        this.logger.debug(`[registerVerifyResend] Sent command registry verify for email ${body.email}`);
    }

    @Post('password/reset')
    @HttpCode(204)
    @ApiBody({ required: true, type: PasswordResetDto })
    @ApiResponse({ status: 204, description: 'NO CONTENT' })
    public async passwordReset(@Body() body: PasswordResetDto): Promise<void> {
        this.logger.debug(`[passwordReset] User ${body.email} starts password reset`);
        if (body.email) {
            const user = await this.userService.findByEmail(body.email);
            if (!user) {
                throw new BadRequestException(`User with email "${body.email}" does not exist.`);
            }
            await this.userEmailQueue.add(USER_EMAIL_PASSWORD_RESET, { user });
        } else {
            throw new BadRequestException('User email is required');
        }
    }

    @Post('password/new')
    @HttpCode(204)
    @ApiBody({ required: true, type: PasswordTokenDto })
    @ApiResponse({ status: 204, description: 'NO CONTENT' })
    public async passwordNew(@Body() body: PasswordTokenDto): Promise<void> {
        this.logger.debug(JSON.stringify(body));
        this.logger.debug(`[passwordNew] Token ${body.resetToken}`);
        const token = await verifyToken(body.resetToken, config.auth.password_reset.secret);
        const user = await this.userService.updatePassword({ id: token.id, password: body.password });
        this.logger.debug(`[passwordNew] Send change password email for user ${user.email}`);
        await this.userEmailQueue.add(USER_EMAIL_PASSWORD_NEW, { user });
    }

    @Post('refresh')
    @HttpCode(200)
    @ApiResponse({ status: 200, description: 'OK', type: JwtDto })
    public async refreshToken(@Body() body: RefreshTokenDto): Promise<JwtDto> {
        this.logger.debug(`[refresh] Token ${body.refreshToken}`);
        const token = await verifyToken(body.refreshToken, config.auth.refresh.secret);
        return await createAuthToken({ id: token.id });
    }

    @Post('facebook')
    @HttpCode(200)
    @UseGuards(AuthGuard('facebook-token'))
    @ApiResponse({ status: 200, description: 'OK', type: JwtDto })
    public async fbSignIn(@User() profile: FacebookProfile): Promise<JwtDto> {
        this.logger.debug(`[fbSignIn] Facebook facebook_id ${profile.id}`);
        let user = await this.userService.findOne({ where: { facebook_id: profile.id } });
        if (!user) {
            this.logger.debug(`[fbSignIn] User with this id doesn't exists before, social register`);
            user = await this.userService.socialRegister({
                email: profile._json.email,
                first_name: profile._json.first_name,
                last_name: profile._json.last_name,
                facebook_id: profile._json.id,
                provider: profile.provider,
                is_verified: true
            });
            await this.userEmailQueue.add(USER_EMAIL_REGISTER_VERIFY, { user });
        }
        return createAuthToken(user);
    }
}
