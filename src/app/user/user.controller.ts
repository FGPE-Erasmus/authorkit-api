import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiImplicitBody, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import voucherCodes from 'voucher-code-generator';
import { config } from '../../config';
import { User } from '../_helpers/decorators';
import { mail, renderTemplate } from '../_helpers/mail';
import { AppLogger } from '../app.logger';
import { createToken } from '../auth/jwt';
import { UserEntity } from './entity';
import { UserCommand } from './user.command';
import { USER_CMD_PASSWORD_NEW, USER_CMD_PASSWORD_RESET, USER_CMD_REGISTER, USER_CMD_REGISTER_VERIFY } from './user.constants';
import { UserService } from './user.service';

@Controller('user')
@ApiUseTags('user')
export class UserController {
    private logger = new AppLogger(UserController.name);

    constructor(
        protected service: UserService,
        private userCmd: UserCommand
    ) {

    }

    @Post('import')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    public async importUsers(): Promise<any> {
        return this.userCmd.create(20);
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
    public async onUserPasswordRest({ email }: { email: string }): Promise<void> {
        try {
            const user = await this.service.findOne({ where: { email } });
            this.logger.debug(`[onUserRegister] Send password reset instruction email for user ${user.email}`);
            const token = createToken(user.id.toString(), config.auth.password_reset.timeout, config.auth.password_reset.secret);
            await mail(
                'reset-password',
                user.email,
                {
                    app_name: config.name,
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
