import { Response } from 'express';
import { appConfig } from '../../app.config';
// import { GqlResponse } from '../../common/decorators/gql-response.decorator';
import { AuthDto } from './dto/auth.dto';
import { KeycloakService } from './keycloak.service';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { ProfileDto } from './dto/profile.dto';
// import { GqlUserInfo } from '../../common/decorators/gql-user-info.decorator';
import { UserDto } from './dto/user.dto';
import {
    UseGuards,
    Controller,
    Post,
    HttpCode,
    Body,
    Res,
    Get,
    Param
} from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { UserService } from './user.service';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { AppLogger } from 'app';
import { AuthController } from 'app/auth/auth.controller';
import { CredentialsDto } from './dto/credentials.dto';

@ApiTags('keycloak')
@Controller('keycloak')
export class KeycloakController {
    private logger = new AppLogger(AuthController.name);

    constructor(
        protected readonly keycloakService: KeycloakService,
        protected readonly userService: UserService
    ) {}

    @Post('login')
    @HttpCode(200)
    @ApiResponse({ status: 200, description: 'OK', type: AuthDto })
    public async login(
        @Body() input: CredentialsDto,
        @Res() res: Response
    ): Promise<AuthDto> {
        this.logger.debug(`[Keycloak login] ${input.username}`);

        const result: AuthDto = await this.keycloakService.authenticate(input);
        res.cookie(appConfig.auth.keycloak.cookieKey, result.accessToken, {
            httpOnly: true
        });
        if (input.redirectUri) {
            res.redirect(input.redirectUri);
        }
        return result;
    }

    @UseGuards(AuthGuard)
    @Get('me')
    async me(userInfo: Record<string, any>): Promise<ProfileDto> {
        return {
            id: userInfo.sub,
            username: userInfo.preferredUsername,
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
            ...userInfo
        };
    }

    // @Query(() => UserDto)
    @Get('user/:id')
    async user(@Param('id') userId: string): Promise<UserDto> {
        return this.userService.getUser(userId);
    }

    // @Public()
    // @Mutation(() => LogoutResponseDto)
    @Post('logout')
    async logout(
        @Res() res: Response,
        @Body() { redirectUri }: { redirectUri?: string }
    ): Promise<LogoutResponseDto> {
        await this.keycloakService.logout();
        res.clearCookie(appConfig.auth.keycloak.cookieKey, { httpOnly: true });
        if (redirectUri) {
            res.redirect(redirectUri);
        }
        return new LogoutResponseDto();
    }

    /*@Mutation(() => UserDto)
  async signup(@Args() input: SignupArgs, @GqlResponse() res: Response): Promise<UserDto> {
    const result: LoginResultDto = await this.authService.signup(input);
    res.cookie('token', result.token, { httpOnly: true });
    return result.user;
  }*/
}
