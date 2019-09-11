import { Controller, Body, Post, UseGuards, Get, Request, Query } from '@nestjs/common';
import { ApiResponse, ApiUseTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './';
import { UsersService } from './../user';
import { LoginPayload, RegisterPayload } from './payloads';
import { async } from 'rxjs/internal/scheduler/async';
import { ForgotPasswordPayload } from './payloads/forgot-password.payload';

@Controller('api/auth')
@ApiUseTags('authentication')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UsersService,
    ) { }

    @Post('login')
    @ApiResponse({ status: 201, description: 'Successful Login' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async login(@Body() payload: LoginPayload): Promise<any> {
        const user = await this.authService.validateUser(payload);
        return await this.authService.createToken(user);
    }

    @Post('register')
    @ApiResponse({ status: 201, description: 'Successful Registration' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async register(@Body() payload: RegisterPayload): Promise<any> {
        // register user
        const user = await this.userService.registerUser(payload);
        // send activation email
        await this.authService.sendActivationEmail(user);
        return user;
    }

    @Get('activate')
    @ApiResponse({ status: 201, description: 'Successful Activation' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async activate(@Query('key') key: string): Promise<any> {

        // activate the user
        const user = await this.authService.activateUser(key);

        // send welcome email
        const sent = this.authService.sendWelcomeEmail(user);

        return true;
    }

    @Post('forgot-password')
    @ApiResponse({ status: 201, description: 'Successful Reset Password Request' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async forgotPassword(@Body() payload: ForgotPasswordPayload): Promise<any> {

        // activate the user
        const user = await this.authService.requestPasswordReset(payload);

        // send reset password email
        const sent = this.authService.sendResetPasswordEmail(user);

        return true;
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard())
    @Get('me')
    @ApiResponse({ status: 200, description: 'Successful Response' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getLoggedInUser(@Request() request): Promise<any> {
        return request.user;
    }
}
